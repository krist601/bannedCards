/** Owner-provided buying rule: Card Kingdom USD price × 450 = offer in CLP. */
export const buyingRateMultiplier = 450;
export const buyingRates = [
  {label:'Reference price',value:'Card Kingdom price (USD)'},
  {label:'Buying rate',value:`Card Kingdom price × ${buyingRateMultiplier} = offer in CLP`},
  {label:'Example: US$10 on Card Kingdom',value:`CLP $${new Intl.NumberFormat('es-CL').format(10 * buyingRateMultiplier)}`},
];
