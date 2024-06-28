function danaherMonthlyReportQuery(year, month) {
    const query = `
    WITH charge_codes AS (
        select
        distinct charges."charge code description"
        from
        datamart.shipment_extract s
        left outer join
        (
        select
            "file number",
            "charge code description"
        from
            datamart.ar_invoices ai
            --where "file number" = '4677697'
        )charges
        on
        s."file number" = charges."file number"
        where
        "original bill to number" in ('2398', '12676', '15059', '4872', '7908', '12170', '2097', '7893', '12172', '12222', '11445', 'SCIDFWDFW', 'ABSCIEXCORP', 'ABSCIEX', 'ABSDISSIN', 'ABSMANSFO', 'LEIMICORD'
        )
        and "source system" in ('CW', 'WT')
        and s.division <> 'Epic'
        and extract('year'
        from
        s."file date") = ${year}
        and extract('month'
        from
        s."file date") = ${month}
        order by
        s."file date"
    )
SELECT 
'select --s.*,
distinct s."house waybill", mode,"original bill to number",c.city,c.state,c.zip,s."house waybill",
s."service level" ,
TO_CHAR(s."file date"::timestamp, \\'YYYY-MM-DD\\') AS "Shipment Date",
TO_CHAR(s."ready date"::timestamp, \\'YYYY-MM-DD HH24:MI:SS:MS\\') AS "Ready Date",
TO_CHAR(s."pod date"::timestamp, \\'YYYY-MM-DD HH24:MI:SS:MS\\') AS "POD Date",
TO_CHAR(s."scheduled delivery date"::timestamp, \\'YYYY-MM-DD HH24:MI:SS:MS\\') AS "Scheduled Delivery Date",
TO_CHAR(charges."invoice printed date"::timestamp, \\'YYYY-MM-DD HH24:MI:SS:MS\\') AS "Invoice Printed Date",
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
charges.*
from datamart.shipment_extract s
left outer join (select * from customers  where 
nbr in (\\'2398\\',\\'12676\\',\\'15059\\',\\'4872\\',\\'7908\\',\\'12170\\',\\'2097\\',\\'7893\\',\\'12172\\',\\'12222\\',\\'11445\\',\\'SCIDFWDFW\\',\\'ABSCIEXCORP\\',\\'ABSCIEX\\',\\'ABSDISSIN\\',\\'ABSMANSFO\\',\\'LEIMICORD\\')
and source_system  in (\\'CW\\',\\'WT\\') and division not in (\\'EPC\\', \\'Epic\\'))c
on s."original bill to number" = c.nbr
left outer join (
select file_nbr,ref_nbr,ref_typeid from(
select 
	file_nbr,ref_nbr,ref_typeid, row_number () over(partition by file_nbr order by seq_nbr desc) as rn
from 
	shipment_ref sr )
where rn=1
)shipperref
on s."file number" = shipperref.file_nbr
left outer join 
(select file_nbr,listagg(dims,\\', \\') within group (order by id desc) as Dims,pieces
from
(SELECT sd.file_nbr,sd.id,\\'(L=\\'||\\'\\'||length||\\' \\'||\\'W=\\'||\\' \\'||width||\\' H=\\'||height||\\')\\' as dims, sum(pieces) over (partition by sd.file_nbr) pieces
from shipment_detl sd 
--where file_nbr = \\'4143990\\'
)a
group by a.file_nbr,pieces
)detl
on s."file number" = detl.file_nbr

left outer join 
(SELECT distinct sd.file_nbr,sd.dim_factor
from shipment_detl sd 
--where file_nbr = \\'4143990\\'
)detl1
on s."file number" = detl1.file_nbr
left outer join 

(SELECT
    "file number",
	sum(total) as "total charges",
	max(total) as "TopLine charge",
    max("invoice printed date") as "invoice printed date",
    max("posted date") as "posted date",
    ' || LISTAGG('MAX(CASE WHEN "charge code description" = ' || QUOTE_LITERAL(cc."charge code description") || ' THEN total  END) AS ' || QUOTE_IDENT(cc."charge code description"), ', ') WITHIN GROUP (ORDER BY cc."charge code description") || '
    FROM datamart.ar_invoices
    -- WHERE "file number" = \\'4677697\\'
    where ar_invoices."source system" = \\'WT\\'
    GROUP BY "file number"
)charges 
on s."file number" = charges."file number"
where "original bill to number"  in (\\'2398\\',\\'12676\\',\\'15059\\',\\'4872\\',\\'7908\\',\\'12170\\',\\'2097\\',\\'7893\\',\\'12172\\',\\'12222\\',\\'11445\\',\\'SCIDFWDFW\\',\\'ABSCIEXCORP\\',\\'ABSCIEX\\',\\'ABSDISSIN\\',\\'ABSMANSFO\\',\\'LEIMICORD\\'
)and "source system" in (\\'CW\\',\\'WT\\') and s.division not in (\\'EPC\\', \\'Epic\\') and charges."posted date" is not NULL AND EXTRACT(YEAR FROM s."file date") = ${year} AND EXTRACT(MONTH FROM s."file date") = ${month} order by s."house waybill", s."file date"
--and s."file number" = \\'4677697\\'
'
FROM charge_codes cc
`;
    return query
}
module.exports = {
    danaherMonthlyReportQuery
}