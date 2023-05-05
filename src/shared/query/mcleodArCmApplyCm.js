const mcleodArCmApplyCm = `SELECT distinct CASE
         WHEN base.charge_type = 'linehaul' THEN
         Concat('OL-', base.bill_type, '-', bh.invoice_no_string)
         WHEN base.charge_type = 'other_charge' THEN
         Concat('OL-', base.bill_type, '-', base.invoice_no_string)
         ELSE ''
       END                              AS "External ID",
	   CASE
         WHEN base.charge_type = 'linehaul' THEN
         Concat('OL-', 'I', '-', bh.invoice_no_string)
         WHEN base.charge_type = 'other_charge' THEN
         Concat('OL-', 'I', '-', base.invoice_no_string)
         ELSE ''
       END                              AS "Apply ID",
sum(CASE
         WHEN base.charge_type = 'linehaul' THEN bh.linehaul_chg
         WHEN base.charge_type = 'other_charge' THEN och.amount
         ELSE ''
       END                              
	   )AS Rate
FROM   (SELECT Concat(Trim(o.invoice_id), '-', Trim(o.id)) AS id,
               'other_charge'                              AS charge_type,
               o.id                                        AS parent_id,
               o.order_id,
               o.bill_type,
               o.invoice_id,
               b.invoice_no_string,
               b.transfer_date,
               b.entered_user_id
        FROM   other_charge_hist o
               LEFT JOIN billing_history b
                      ON b.id = o.invoice_id
        UNION
        SELECT Concat(Trim(id), '-', Trim(bill_type), '-linehaul') AS id,
               'linehaul'                                          AS
               charge_type,
               id                                                  AS parent_id,
               order_id,
               bill_type,
               id                                                  AS invoice_id
               ,
               invoice_no_string,
               transfer_date,
               entered_user_id                                     AS
               billing_user_id
        FROM   billing_history) base
       LEFT JOIN billing_history bh
              ON bh.id = base.parent_id
       LEFT JOIN other_charge_hist och
              ON och.id = base.parent_id
       LEFT JOIN orders o
              ON o.id = base.order_id
       LEFT JOIN order_type ot
              ON o.order_type_id = ot.id
       LEFT JOIN stop s1
              ON s1.id = o.shipper_stop_id
       LEFT JOIN stop s2
              ON s2.id = o.consignee_stop_id
       LEFT JOIN freight_group fg
              ON fg.lme_order_id = o.id
WHERE  ( CASE
           WHEN base.charge_type = 'linehaul' THEN bh.invoice_no_string
           WHEN base.charge_type = 'other_charge' THEN base.invoice_no_string
           ELSE ''
         END ) IS NOT NULL 
		 and  base.transfer_date >= dateadd(hour, -24, getdate())
		 and base.bill_type = 'C'
		 group by CASE
         WHEN base.charge_type = 'linehaul' THEN
         Concat('OL-', base.bill_type, '-', bh.invoice_no_string)
         WHEN base.charge_type = 'other_charge' THEN
         Concat('OL-', base.bill_type, '-', base.invoice_no_string)
         ELSE ''
       END,
	   CASE
         WHEN base.charge_type = 'linehaul' THEN
         Concat('OL-', 'I', '-', bh.invoice_no_string)
         WHEN base.charge_type = 'other_charge' THEN
         Concat('OL-', 'I', '-', base.invoice_no_string)
         ELSE ''
       END`

module.exports = { mcleodArCmApplyCm }