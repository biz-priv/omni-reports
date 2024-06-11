/*
* File: src\shared\query\omniOverstockWeeklyReportsQuery.js
* Project: Omni-reports
* Author: Bizcloud Experts
* Date: 2023-05-05
* Confidential and Proprietary
*/
const omniOverstockWeeklyReportsSqlQuery = `select
  s.file_date as "Order Create Date - Y-M-D",
  s.house_bill_nbr as "HouseBill",
  s.file_nbr as "Job Number",
  bref.cust_ref_nbr as "Client Ref Number(s)",
  s.service_level as "Service Level",
  s.shipper_name as "Shipper Name",
  s.shipper_addr_1 as "Shipper Address1",
  s.shipper_addr_2 as "Shipper Address2",
  s.shipper_city as "Shipper City",
  s.shipper_st as "Shipper State" ,
  s.shipper_zip as "Shipper Zip",
  s.shipper_cntry as "Shipper Ctry",
  sref.shipper_ref_nbr as "Shipper Ref Number(s)",
  s.consignee_name  as "Consignee Name",
  s.consignee_addr_1 as "Consignee Address1",
  s.consignee_addr_2  as "Consignee Address2",
  s.consignee_city  as "Consignee  City",
  s.consignee_st as "Cosignee State",
  s.consignee_zip as "Consignee Zip",
  s.consignee_cntry as "Consignee Ctry",
  cref.consignee_ref_nbr as "Consignee Ref Number(s)",
  s.pieces as "Pack Count",
  detl.piece_type as "Pack Type",
  s.actual_wght_lbs as "Actual Weight (LBs)",
  s.chrg_wght_lbs as "Chargeable Weight (LBs)",
  detl.dim as "Product Dims (Grouped)",
  s.description as "Description",
  s.ready_Date as "Estimate Departure Date - Full",
  s.pickup_Date as "Actual Departure Date - Full",
  s.schd_delv_Date as "Estimate Delivery Date - Full",
  s.pod_Date as "Actual Delivery Date - Full",
  s.pod_name as "Delivery Signed By",
  s.modeid as "MODE",
  s.insurance as "Insurance Amount",
  frt.frt_chrg as "Job Freight Cost",
  fsc.fsc_chrg as "Job Fuel Sur Charge",
  crg.charge_cd_desc as "Charge Desc",
  crg.crg_chrg as "Sell Amt",
  sum(crg.crg_chrg) over (partition by s.file_nbr) as "Job Total Sell",
  s.current_status as "Internal Status"
  from shipment_info s
  left outer join 
  (select source_system ,file_nbr,listagg(distinct ref_nbr,',') within group (order by pk_ref_nbr desc)cust_ref_nbr  from shipment_ref where source_system = 'WT' and customer_type = 'B'
  and file_nbr = '4966574'
  group by source_system ,file_nbr )bref
  on s.source_system = bref.source_system 
  and s.file_nbr = bref.file_nbr 
  left outer join 
  (select source_system ,file_nbr,listagg(distinct ref_nbr,',') within group (order by pk_ref_nbr desc)shipper_ref_nbr  from shipment_ref where source_system = 'WT' and customer_type = 'S'
  and file_nbr = '4966574'
  group by source_system ,file_nbr )sref
  on s.source_system = sref.source_system 
  and s.file_nbr = sref.file_nbr
  left outer join 
  (select source_system ,file_nbr,listagg(distinct ref_nbr,',') within group (order by pk_ref_nbr desc)consignee_ref_nbr  from shipment_ref where source_system = 'WT' and customer_type = 'C'
  and file_nbr = '4966574'
  group by source_system ,file_nbr )cref
  on s.source_system = sref.source_system 
  and s.file_nbr = sref.file_nbr
  
  left outer join 
  (select source_system ,file_nbr ,sum(total)frt_chrg from ar_invoice_receivables air 
  where is_deleted = 'N'
  and charge_cd = 'FRT'
  group by source_system ,file_nbr
  )frt
  on s.source_system = frt.source_system
  and s.file_nbr = frt.file_nbr
  left outer join 
  (select source_system ,file_nbr ,sum(total)fsc_chrg from ar_invoice_receivables air 
  where is_deleted = 'N'
  and charge_cd = 'FSC'
  group by source_system ,file_nbr 
  )fsc
  on s.source_system = fsc.source_system
  and s.file_nbr = fsc.file_nbr
  left outer join 
  (select source_system ,file_nbr ,charge_cd_desc,sum(total)crg_chrg from ar_invoice_receivables air 
  where is_deleted = 'N'
  group by source_system ,file_nbr,charge_cd_desc 
  )crg
  on s.source_system = crg.source_system
  and s.file_nbr = crg.file_nbr
  left outer join 
  (
  select source_system ,file_nbr ,
  listagg(distinct  piece_type,',') within group (order by seq_nbr)piece_type,
  listagg(distinct '(L'||'='||length ||', '|| 'W'||'='||width||', '||'H'||'='||height ||')' ,',') within group (order by seq_nbr) dim
  from shipment_detl sd 
  group by source_system ,file_nbr 
  )detl
  on s.source_system = detl.source_system
  and s.file_nbr = detl.file_nbr
  where --s.file_nbr = '4966574'
  s.current_status = 'PST'
  and cast(s.pod_date as date) >= current_date - 30
  and s.bill_to_nbr = '11912'`;


module.exports = { omniOverstockWeeklyReportsSqlQuery };
