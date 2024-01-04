const jwtSecret = process.env.SECRET || 'secret';

const USER_STATUS = {
  APPROVED: 'APPROVED',
  PENDING: 'PENDING',
  DECLINED: 'DECLINED',
  INPROGRESS:'INPROGRESS'
}

const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PAID: 'PAID',
}

const COIN_NETWORK_TYPE = {
  MAIN_NET: 'MAIN_NET',
  TEST_NET: 'TEST_NET',
}

export {
  USER_STATUS,
  jwtSecret,
  PAYMENT_STATUS,
  COIN_NETWORK_TYPE,
};
