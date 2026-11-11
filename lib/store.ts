export const instagram = 'https://www.instagram.com/tejidos_de_scarleth/'
export const clp = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' })
export const collections = [
  { slug: 'gorros', name: 'Gorros' },
  { slug: 'bufandas', name: 'Bufandas' },
  { slug: 'cuellos', name: 'Cuellos' },
  { slug: 'cintillos', name: 'Cintillos' },
  { slug: 'mitones', name: 'Mitones' },
  { slug: 'bolsos-reciclados', name: 'Bolsos reciclados' },
]
export const policies = [
  { slug: 'despacho', name: 'Política de despacho', field: 'shipping' },
  { slug: 'cambios', name: 'Cambios y devoluciones', field: 'returns' },
  { slug: 'terminos', name: 'Términos y condiciones', field: 'terms' },
  { slug: 'privacidad', name: 'Política de privacidad', field: 'privacy' },
] as const