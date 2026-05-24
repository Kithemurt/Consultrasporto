// Consultrasporto — Scadenziario Formazione D.Lgs. 81/08
// Data layer: localStorage CRUD + sample data + aggregations

const DB = {
  KEYS: {
    lavoratori: 'ct_lavoratori',
    corsi: 'ct_corsi',
    visite: 'ct_visite',
    init: 'ct_initialized'
  },

  // ─── Status helpers ────────────────────────────────────────────────────────
  getStatus(dateStr) {
    if (!dateStr) return 'scaduto';
    const diff = Math.floor((new Date(dateStr) - new Date()) / 86400000);
    if (diff < 0) return 'scaduto';
    if (diff <= 60) return 'in-scadenza';
    return 'valido';
  },

  getDaysToExpiry(dateStr) {
    if (!dateStr) return -9999;
    return Math.floor((new Date(dateStr) - new Date()) / 86400000);
  },

  addDays(dateStr, days) {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  },

  today() { return new Date().toISOString().split('T')[0]; },

  // ─── Lavoratori ────────────────────────────────────────────────────────────
  getLavoratori() { return JSON.parse(localStorage.getItem(this.KEYS.lavoratori) || '[]'); },
  getLavoratore(id) { return this.getLavoratori().find(l => l.id === id); },
  _saveLavoratori(data) { localStorage.setItem(this.KEYS.lavoratori, JSON.stringify(data)); },
  addLavoratore(data) {
    const list = this.getLavoratori();
    const item = { ...data, id: genId(), attivo: true };
    list.push(item);
    this._saveLavoratori(list);
    return item;
  },
  updateLavoratore(id, data) {
    this._saveLavoratori(this.getLavoratori().map(l => l.id === id ? { ...l, ...data } : l));
  },
  deleteLavoratore(id) {
    this._saveLavoratori(this.getLavoratori().filter(l => l.id !== id));
    this._saveCorsi(this.getCorsi().filter(c => c.lavoratoreId !== id));
    this._saveVisite(this.getVisite().filter(v => v.lavoratoreId !== id));
  },

  // ─── Corsi ─────────────────────────────────────────────────────────────────
  getCorsi() { return JSON.parse(localStorage.getItem(this.KEYS.corsi) || '[]'); },
  _saveCorsi(data) { localStorage.setItem(this.KEYS.corsi, JSON.stringify(data)); },
  addCorso(data) {
    const list = this.getCorsi();
    const item = { ...data, id: genId() };
    list.push(item);
    this._saveCorsi(list);
    return item;
  },
  updateCorso(id, data) {
    this._saveCorsi(this.getCorsi().map(c => c.id === id ? { ...c, ...data } : c));
  },
  deleteCorso(id) { this._saveCorsi(this.getCorsi().filter(c => c.id !== id)); },

  // ─── Visite mediche ────────────────────────────────────────────────────────
  getVisite() { return JSON.parse(localStorage.getItem(this.KEYS.visite) || '[]'); },
  _saveVisite(data) { localStorage.setItem(this.KEYS.visite, JSON.stringify(data)); },
  addVisita(data) {
    const list = this.getVisite();
    const item = { ...data, id: genId() };
    list.push(item);
    this._saveVisite(list);
    return item;
  },
  updateVisita(id, data) {
    this._saveVisite(this.getVisite().map(v => v.id === id ? { ...v, ...data } : v));
  },
  deleteVisita(id) { this._saveVisite(this.getVisite().filter(v => v.id !== id)); },

  // ─── Aggregations ──────────────────────────────────────────────────────────
  getStats() {
    const lav = this.getLavoratori().filter(l => l.attivo);
    const corsi = this.getCorsi();
    const visite = this.getVisite();
    const s = status => x => this.getStatus(x.dataScadenza) === status;
    return {
      lavoratori: lav.length,
      corsiValidi: corsi.filter(s('valido')).length,
      corsiInScadenza: corsi.filter(s('in-scadenza')).length,
      corsiScaduti: corsi.filter(s('scaduto')).length,
      visiteValide: visite.filter(s('valido')).length,
      visiteInScadenza: visite.filter(s('in-scadenza')).length,
      visiteScadute: visite.filter(s('scaduto')).length,
    };
  },

  getScadenzeImminenti(giorni = 90) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + giorni);
    const today = new Date();
    const items = [];

    this.getCorsi().forEach(c => {
      const d = new Date(c.dataScadenza);
      if (d >= today && d <= cutoff) {
        const lav = this.getLavoratore(c.lavoratoreId);
        items.push({
          id: c.id, tipo: 'corso', tipoLabel: c.tipoCorso,
          lavoratore: lav ? `${lav.nome} ${lav.cognome}` : '—',
          dataScadenza: c.dataScadenza,
          status: this.getStatus(c.dataScadenza),
          giorni: this.getDaysToExpiry(c.dataScadenza)
        });
      }
    });

    this.getVisite().forEach(v => {
      const d = new Date(v.dataScadenza);
      if (d >= today && d <= cutoff) {
        const lav = this.getLavoratore(v.lavoratoreId);
        items.push({
          id: v.id, tipo: 'visita', tipoLabel: v.tipoVisita,
          lavoratore: lav ? `${lav.nome} ${lav.cognome}` : '—',
          dataScadenza: v.dataScadenza,
          status: this.getStatus(v.dataScadenza),
          giorni: this.getDaysToExpiry(v.dataScadenza)
        });
      }
    });

    items.sort((a, b) => new Date(a.dataScadenza) - new Date(b.dataScadenza));
    return items;
  },

  getScadutiRecenti() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const items = [];

    [...this.getCorsi(), ...this.getVisite()].forEach(x => {
      const d = new Date(x.dataScadenza);
      if (d < new Date() && d >= cutoff) {
        const lav = this.getLavoratore(x.lavoratoreId);
        items.push({
          lavoratore: lav ? `${lav.nome} ${lav.cognome}` : '—',
          label: x.tipoCorso || x.tipoVisita,
          dataScadenza: x.dataScadenza
        });
      }
    });
    return items.sort((a, b) => new Date(b.dataScadenza) - new Date(a.dataScadenza));
  },

  // ─── Sample data init ──────────────────────────────────────────────────────
  init() {
    if (localStorage.getItem(this.KEYS.init)) return;

    const t = this.today();
    const lavoratori = [
      { id: 'l1', nome: 'Mario', cognome: 'Rossi', codiceFiscale: 'RSSMRA80A01H501U', mansione: 'Autista', reparto: 'Trasporti', dataAssunzione: '2018-03-15', rischi: ['Movimentazione manuale carichi', 'Stress da lavoro'], attivo: true },
      { id: 'l2', nome: 'Giulia', cognome: 'Bianchi', codiceFiscale: 'BNCGLI85B41H501P', mansione: 'Impiegata', reparto: 'Amministrazione', dataAssunzione: '2019-07-01', rischi: ['VDT (videoterminale)'], attivo: true },
      { id: 'l3', nome: 'Francesco', cognome: 'Esposito', codiceFiscale: 'SPSFNC90C01F839T', mansione: 'Tecnico Manutentore', reparto: 'Manutenzione', dataAssunzione: '2017-01-10', rischi: ['Elettrico', 'Rumore', 'Sostanze pericolose'], attivo: true },
      { id: 'l4', nome: 'Alessandra', cognome: 'Romano', codiceFiscale: 'RMNLSN88D41H501K', mansione: 'Magazziniere', reparto: 'Logistica', dataAssunzione: '2020-02-20', rischi: ['Movimentazione manuale carichi', 'Carrelli elevatori'], attivo: true },
      { id: 'l5', nome: 'Roberto', cognome: 'Ferretti', codiceFiscale: 'FRTRRT75E01H501Z', mansione: 'Carrellista', reparto: 'Logistica', dataAssunzione: '2016-06-01', rischi: ['Carrelli elevatori', 'Movimentazione manuale carichi'], attivo: true },
      { id: 'l6', nome: 'Chiara', cognome: 'Conti', codiceFiscale: 'CNTCHR82F41H501V', mansione: 'RSPP', reparto: 'Sicurezza', dataAssunzione: '2015-09-01', rischi: [], attivo: true },
      { id: 'l7', nome: 'Luca', cognome: 'Russo', codiceFiscale: 'RSSLCU92G01H501Q', mansione: 'Operaio', reparto: 'Produzione', dataAssunzione: '2021-04-01', rischi: ['Rumore', 'Vibrazione'], attivo: true },
      { id: 'l8', nome: 'Sara', cognome: 'Moretti', codiceFiscale: 'MRTSRA95H41H501X', mansione: 'Tecnico Qualità', reparto: 'Qualità', dataAssunzione: '2022-01-15', rischi: ['VDT (videoterminale)', 'Sostanze chimiche'], attivo: true },
      { id: 'l9', nome: 'Antonio', cognome: 'De Luca', codiceFiscale: 'DLCNTN78I01H501M', mansione: 'Autista Pesante', reparto: 'Trasporti', dataAssunzione: '2014-11-01', rischi: ['Guida prolungata', 'Stress da lavoro'], attivo: true },
      { id: 'l10', nome: 'Valentina', cognome: 'Colombo', codiceFiscale: 'CLMVNT87L41H501R', mansione: 'Addetta alla Reception', reparto: 'Amministrazione', dataAssunzione: '2023-03-01', rischi: ['VDT (videoterminale)'], attivo: true },
    ];

    const corsi = [
      // Validi (lontani)
      { id: 'c1', lavoratoreId: 'l1', tipoCorso: 'Formazione Generale (8 ore)', ente: 'INAIL Formazione', dataFrequenza: this.addDays(t, -400), dataScadenza: this.addDays(t, 1426), ore: 8, attestatoNum: 'ATT-2024-001', note: '' },
      { id: 'c2', lavoratoreId: 'l1', tipoCorso: 'Formazione Specifica Medio Rischio', ente: 'Studio Sicurezza Srl', dataFrequenza: this.addDays(t, -300), dataScadenza: this.addDays(t, 1526), ore: 8, attestatoNum: 'ATT-2024-002', note: '' },
      { id: 'c3', lavoratoreId: 'l2', tipoCorso: 'Formazione Generale (4 ore)', ente: 'INAIL Formazione', dataFrequenza: this.addDays(t, -500), dataScadenza: this.addDays(t, 1326), ore: 4, attestatoNum: 'ATT-2023-010', note: '' },
      { id: 'c4', lavoratoreId: 'l3', tipoCorso: 'Antincendio Rischio Medio', ente: 'VVF Formazione', dataFrequenza: this.addDays(t, -200), dataScadenza: this.addDays(t, 895), ore: 8, attestatoNum: 'ATT-2024-015', note: '' },
      { id: 'c5', lavoratoreId: 'l6', tipoCorso: 'Formazione Preposti (8 ore)', ente: 'Studio Sicurezza Srl', dataFrequenza: this.addDays(t, -100), dataScadenza: this.addDays(t, 1726), ore: 8, attestatoNum: 'ATT-2025-001', note: '' },
      { id: 'c6', lavoratoreId: 'l7', tipoCorso: 'Formazione Generale (8 ore)', ente: 'INAIL Formazione', dataFrequenza: this.addDays(t, -350), dataScadenza: this.addDays(t, 1476), ore: 8, attestatoNum: 'ATT-2024-022', note: '' },
      { id: 'c7', lavoratoreId: 'l8', tipoCorso: 'Formazione Specifica Basso Rischio', ente: 'Studio Sicurezza Srl', dataFrequenza: this.addDays(t, -90), dataScadenza: this.addDays(t, 1736), ore: 4, attestatoNum: 'ATT-2025-005', note: '' },
      { id: 'c8', lavoratoreId: 'l9', tipoCorso: 'Formazione Generale (8 ore)', ente: 'INAIL Formazione', dataFrequenza: this.addDays(t, -600), dataScadenza: this.addDays(t, 1226), ore: 8, attestatoNum: 'ATT-2023-030', note: '' },
      // In scadenza (entro 60 giorni)
      { id: 'c9', lavoratoreId: 'l4', tipoCorso: 'Carrelli Elevatori', ente: 'Centro Formazione Lavoro', dataFrequenza: this.addDays(t, -1800), dataScadenza: this.addDays(t, 25), ore: 12, attestatoNum: 'ATT-2021-008', note: 'Rinnovo urgente!' },
      { id: 'c10', lavoratoreId: 'l5', tipoCorso: 'Carrelli Elevatori', ente: 'Centro Formazione Lavoro', dataFrequenza: this.addDays(t, -1820), dataScadenza: this.addDays(t, 45), ore: 12, attestatoNum: 'ATT-2021-009', note: '' },
      { id: 'c11', lavoratoreId: 'l3', tipoCorso: 'Primo Soccorso Gruppo B', ente: 'Croce Rossa Italiana', dataFrequenza: this.addDays(t, -1080), dataScadenza: this.addDays(t, 15), ore: 12, attestatoNum: 'ATT-2022-004', note: '' },
      { id: 'c12', lavoratoreId: 'l9', tipoCorso: 'Antincendio Rischio Basso', ente: 'VVF Formazione', dataFrequenza: this.addDays(t, -1080), dataScadenza: this.addDays(t, 50), ore: 4, attestatoNum: 'ATT-2022-011', note: '' },
      // Scaduti
      { id: 'c13', lavoratoreId: 'l10', tipoCorso: 'Formazione Generale (4 ore)', ente: 'INAIL Formazione', dataFrequenza: this.addDays(t, -1900), dataScadenza: this.addDays(t, -80), ore: 4, attestatoNum: 'ATT-2021-018', note: 'Da rinnovare' },
      { id: 'c14', lavoratoreId: 'l2', tipoCorso: 'Primo Soccorso Gruppo B', ente: 'Croce Rossa Italiana', dataFrequenza: this.addDays(t, -1200), dataScadenza: this.addDays(t, -120), ore: 12, attestatoNum: 'ATT-2022-020', note: '' },
      { id: 'c15', lavoratoreId: 'l7', tipoCorso: 'Antincendio Rischio Basso', ente: 'VVF Formazione', dataFrequenza: this.addDays(t, -1300), dataScadenza: this.addDays(t, -205), ore: 4, attestatoNum: 'ATT-2021-031', note: '' },
    ];

    const visite = [
      // Valide
      { id: 'v1', lavoratoreId: 'l1', tipoVisita: 'Visita Periodica Annuale', medico: 'Dott. Sergio Amato', dataVisita: this.addDays(t, -90), dataScadenza: this.addDays(t, 275), giudizio: 'Idoneo', note: '' },
      { id: 'v2', lavoratoreId: 'l2', tipoVisita: 'Visita Periodica Biennale', medico: 'Dott.ssa Maria Riva', dataVisita: this.addDays(t, -120), dataScadenza: this.addDays(t, 610), giudizio: 'Idoneo', note: '' },
      { id: 'v3', lavoratoreId: 'l3', tipoVisita: 'Visita Periodica Annuale', medico: 'Dott. Sergio Amato', dataVisita: this.addDays(t, -60), dataScadenza: this.addDays(t, 305), giudizio: 'Idoneo con prescrizioni', note: 'Limitazione al sollevamento oltre 20 kg' },
      { id: 'v4', lavoratoreId: 'l5', tipoVisita: 'Visita Periodica Annuale', medico: 'Dott. Sergio Amato', dataVisita: this.addDays(t, -200), dataScadenza: this.addDays(t, 165), giudizio: 'Idoneo', note: '' },
      { id: 'v5', lavoratoreId: 'l6', tipoVisita: 'Visita Periodica Biennale', medico: 'Dott.ssa Maria Riva', dataVisita: this.addDays(t, -30), dataScadenza: this.addDays(t, 700), giudizio: 'Idoneo', note: '' },
      { id: 'v6', lavoratoreId: 'l8', tipoVisita: 'Visita Preventiva', medico: 'Dott.ssa Maria Riva', dataVisita: this.addDays(t, -100), dataScadenza: this.addDays(t, 630), giudizio: 'Idoneo', note: '' },
      { id: 'v7', lavoratoreId: 'l9', tipoVisita: 'Visita Periodica Annuale', medico: 'Dott. Sergio Amato', dataVisita: this.addDays(t, -270), dataScadenza: this.addDays(t, 95), giudizio: 'Idoneo', note: '' },
      // In scadenza
      { id: 'v8', lavoratoreId: 'l4', tipoVisita: 'Visita Periodica Annuale', medico: 'Dott. Sergio Amato', dataVisita: this.addDays(t, -340), dataScadenza: this.addDays(t, 30), giudizio: 'Idoneo', note: '' },
      { id: 'v9', lavoratoreId: 'l7', tipoVisita: 'Visita Periodica Annuale', medico: 'Dott. Sergio Amato', dataVisita: this.addDays(t, -350), dataScadenza: this.addDays(t, 20), giudizio: 'Idoneo', note: '' },
      // Scadute
      { id: 'v10', lavoratoreId: 'l10', tipoVisita: 'Visita Periodica Annuale', medico: 'Dott.ssa Maria Riva', dataVisita: this.addDays(t, -500), dataScadenza: this.addDays(t, -135), giudizio: 'Idoneo', note: 'Da riprogrammare' },
    ];

    this._saveLavoratori(lavoratori);
    this._saveCorsi(corsi);
    this._saveVisite(visite);
    localStorage.setItem(this.KEYS.init, '1');
  }
};

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
