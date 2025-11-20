/**
 * 字数流水类型
 */
export enum TransactionType {
  /** 充值 */
  RECHARGE = 'recharge',
  /** 消费 */
  CONSUME = 'consume',
  /** 退款 */
  REFUND = 'refund',
  /** 过期 */
  EXPIRE = 'expire',
  /** 赠送 */
  GIFT = 'gift',
}
