const omniWeeklyServiceReportSqlQuery = `
    select
    s.pickup_date as "actualDepartDate",
    --s.file_nbr,
    s.house_bill_nbr as "houseRef",
    s.shipper_name "consignorName",
    s.consignee_name "consigneeName",
    s.consignee_city "consigneeCity",
    s.consignee_st "cosigneeState",
    s.consignee_zip "consigneeZip",
    s.service_level "serviceLevel",
    refb.ref_nbr as "shippersRefNumber",
    refs.ref_nbr as "ShipperRefNumber",
    pieces as "Outer",
    s.actual_wght_lbs as "actualWeight",
    ar.total as "jobTotalSell"
    from 
    (
    select 
    s.source_system,cast(s.pickup_date as date)pickup_date ,s.file_nbr,s.bill_to_nbr,s.house_bill_nbr,s.shipper_name,
    s.consignee_name,s.consignee_city,s.consignee_st,s.consignee_zip,s.service_level,pieces,s.actual_wght_lbs
    from shipment_info s
    where current_Status not in ('CAN')
    and shipment_quote = 'S'
    and source_system = 'WT'
    and bill_to_nbr = '9573'
    and s.file_Date >= current_Date-365
    --and file_nbr = '4952303'
    --and house_bill_nbr = '6988525'
    --and s.file_nbr not in (select distinct file_nbr from shipment_milestone where source_system ='WT' and order_Status = 'DEL')
    )s
    left outer join 
    (select source_system,file_nbr,sum(total)total from ar_invoice_receivables where source_system = 'WT' and is_deleted = 'N' group by file_nbr, source_system)ar
    on 
    s.source_system = ar.source_system
    and s.file_nbr = ar.file_nbr
    left outer join 
    (select source_system ,file_nbr,listagg(distinct ref_nbr,',') within group (order by pk_ref_nbr desc)ref_nbr  from shipment_ref where source_system = 'WT' and customer_type = 'B'
    --and file_nbr = '4984076'
    group by source_system ,file_nbr )refb
    on s.source_system = refb.source_system
    and s.file_nbr= refb.file_nbr
    left outer join 
    (select source_system ,file_nbr,listagg(distinct ref_nbr,',') within group (order by pk_ref_nbr desc)ref_nbr  from shipment_ref where source_system = 'WT' and customer_type = 'S'
    --and file_nbr = '4984076'
    group by source_system ,file_nbr )refs
    on s.source_system = refs.source_system
    and s.file_nbr = refs.file_nbr
    `;

module.exports = { omniWeeklyServiceReportSqlQuery };