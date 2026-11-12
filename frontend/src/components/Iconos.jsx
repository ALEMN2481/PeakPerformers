const base = {
  viewBox: '0 0 24 24', fill: 'none', strokeWidth: 1.8,
  strokeLinecap: 'round', strokeLinejoin: 'round', stroke: 'currentColor',
}

export const IconoLogo = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round">
    <path d="M12 3l4 2.3v4.6L12 12 8 9.9V5.3L12 3zM6 12.5l4 2.3v4.6L6 21.7l-4-2.3v-4.6l4-2.3zM18 12.5l4 2.3v4.6l-4 2.3-4-2.3v-4.6l4-2.3z" />
  </svg>
)
export const IconoCaja = () => (<svg {...base}><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" /><path d="M3 8l9 5 9-5M12 13v8" /></svg>)
export const IconoEscaner = () => (<svg {...base}><path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3" /><path d="M8 12h8" /></svg>)
export const IconoEscudo = () => (<svg {...base}><path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6l8-3z" /><path d="M9 12l2 2 4-4" /></svg>)
export const IconoLista = () => (<svg {...base}><path d="M10 6h10M10 12h10M10 18h10" /><path d="M3 6l1.5 1.5L7 5M3 12l1.5 1.5L7 11M3 18l1.5 1.5L7 17" /></svg>)
export const IconoFlecha = () => (<svg {...base} strokeWidth="2.2"><path d="M5 12h14M13 6l6 6-6 6" /></svg>)
export const IconoVolver = () => (<svg {...base} strokeWidth="2.2"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>)
export const IconoInfo = () => (<svg {...base}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></svg>)
export const IconoOjo = ({ tachado }) => (
  <svg {...base}>
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
    {tachado && <path d="M4 4l16 16" />}
  </svg>
)

export const IconoPanel = () => (<svg {...base}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>)
export const IconoCamion = () => (<svg {...base}><path d="M2 6h11v10H2zM13 9h4l3 3v4h-7" /><circle cx="7" cy="17.5" r="1.8" /><circle cx="16.5" cy="17.5" r="1.8" /></svg>)
export const IconoUsuarios = () => (<svg {...base}><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 4.5a3.2 3.2 0 010 6M18 14.5c2 .7 3.5 2.6 3.5 5" /></svg>)
export const IconoReloj = () => (<svg {...base}><path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></svg>)
export const IconoAyuda = () => (<svg {...base}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2M12 17h.01" /></svg>)
export const IconoCampana = () => (<svg {...base}><path d="M6 8a6 6 0 1112 0c0 7 3 8 3 8H3s3-1 3-8zM10 20a2 2 0 004 0" /></svg>)
export const IconoTienda = () => (<svg {...base}><path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9c0 1.7 1.3 3 2.7 3S9.3 10.7 9.3 9c0 1.7 1.3 3 2.7 3s2.7-1.3 2.7-3c0 1.7 1.3 3 2.7 3S20 10.7 20 9" /></svg>)
export const IconoBuscar = () => (<svg {...base}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>)
export const IconoCalendario = () => (<svg {...base}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>)
export const IconoDescargar = () => (<svg {...base}><path d="M12 4v11M7 10l5 5 5-5M4 20h16" /></svg>)
export const IconoMas = () => (<svg {...base} strokeWidth="2.2"><path d="M12 5v14M5 12h14" /></svg>)
export const IconoEnviar = () => (<svg {...base}><path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z" /></svg>)
export const IconoImpresora = () => (<svg {...base}><path d="M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z" /></svg>)
export const IconoAlerta = () => (<svg {...base}><path d="M12 3l10 18H2L12 3z" /><path d="M12 10v5M12 18h.01" /></svg>)
export const IconoClip = () => (<svg {...base}><path d="M20 11l-8.5 8.5a5 5 0 01-7-7L13 4a3.5 3.5 0 015 5l-8.5 8.5a2 2 0 01-3-3L14 7" /></svg>)
