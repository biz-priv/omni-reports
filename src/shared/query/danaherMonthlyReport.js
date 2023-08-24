async function danaherMonthlyReportQuery(year, month) {


    const query = `select --s.*,
mode,"original bill to number",c.city,c.state,c.zip,s."house waybill",
s."service level" ,
TO_CHAR(s."file date"::timestamp, 'YYYY-MM-DD') AS "Shipment Date",
TO_CHAR(s."ready date"::timestamp, 'YYYY-MM-DD HH24:MI:SS:MS') AS "Ready Date",
TO_CHAR(s."pod date"::timestamp, 'YYYY-MM-DD HH24:MI:SS:MS') AS "POD Date",
TO_CHAR(s."scheduled delivery date"::timestamp, 'YYYY-MM-DD HH24:MI:SS:MS') AS "Scheduled Delivery Date",
TO_CHAR(charges."invoice printed date"::timestamp, 'YYYY-MM-DD HH24:MI:SS:MS') AS "Invoice Printed Date",
shipperref.ref_nbr,
s."original bill to customer" ,
s."actual weight lbs",
s."chargable weight lbs",
s."shipper name",
s."shipper city",
s."shipper state",
s."shipper country",
s."shipper zip",
s."consignee name",
s."consignee city",
s."consignee state",
s."consignee country",
s."consignee zip",
detl.Dims,
detl.pieces,
detl1.dim_factor,
charges."total charges",
charges."TopLine charge",
charges."charge code description",
charges.total
from datamart.shipment_extract s
left outer join (select * from customers  where 
nbr in ('2398','12676','15059','4872','7908','12170','2097','7893','12172','12222','11445','SCIDFWDFW','ABSCIEXCORP','ABSCIEX','ABSDISSIN','ABSMANSFO','LEIMICORD')
and source_system  in ('CW','WT') and division <> 'Epic')c
on s."original bill to number" = c.nbr
left outer join (select file_nbr,ref_nbr from shipment_ref sr 
where --file_nbr = '4143990'
customer_type = 'S'
and ref_typeid = 'REF')shipperref
on s."file number" = shipperref.file_nbr
left outer join 
(select file_nbr,listagg(dims,', ') within group (order by id desc) as Dims,pieces
from
(SELECT sd.file_nbr,sd.id,'(L='||''||length||' '||'W='||' '||width||' H='||height||')' as dims, sum(pieces) over (partition by sd.file_nbr) pieces
from shipment_detl sd 
--where file_nbr = '4143990'
)a
group by a.file_nbr,pieces
)detl
on s."file number" = detl.file_nbr

left outer join 
(SELECT distinct sd.file_nbr,sd.dim_factor
from shipment_detl sd 
--where file_nbr = '4143990'
)detl1
on s."file number" = detl1.file_nbr
left outer join 

(select 
"file number",
"charge code description" ,
total,
"invoice printed date" ,
sum(total) over (partition by "file number")as "total charges" ,
max(total)over (partition by "file number")as "TopLine charge"
from datamart.ar_invoices ai
--where "file number" = '4677697'
)charges 
on s."file number" = charges."file number"
where "original bill to number"  in ('2398','12676','15059','4872','7908','12170','2097','7893','12172','12222','11445','SCIDFWDFW','ABSCIEXCORP','ABSCIEX','ABSDISSIN','ABSMANSFO','LEIMICORD'
)and "source system" in ('CW','WT') and s.division <> 'Epic' AND EXTRACT(YEAR FROM s."file date") = ${year} AND EXTRACT(MONTH FROM s."file date") = ${month} order by s."file date"
--and s."file number" = '4677697'
`;
    return query
}
module.exports = {
    danaherMonthlyReportQuery
}