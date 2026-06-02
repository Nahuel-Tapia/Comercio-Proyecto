export const SITE = {
  brand: 'Lé Désir',
  brandFull: 'Lé Désir Fragancias',
  instagramHandle: '@ledesir.fragancias',
  instagramUrl: 'https://www.instagram.com/ledesir.fragancias',
  whatsappNumber: '5491123456789',
  email: 'hola@ledesirfragancias.com',
  pickupLabel: 'Retiro a coordinar',
};

export const whatsappLink = (message = 'Hola, quiero hacer una consulta sobre las fragancias.') =>
  `https://wa.me/${SITE.whatsappNumber}?text=${encodeURIComponent(message)}`;
