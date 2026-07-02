// Estrutura inicial do board — processo de design de sistemas.
// "owner" define o responsável padrão daquela etapa: eu | cliente | interno
// "waitsOn" indica se a etapa normalmente espera retorno de alguém (ativa due date em destaque)

export const COLUMN_DEFS = [
  { id: 'col-1',  title: 'Criação do design',             owner: 'eu',      waitsOn: false },
  { id: 'col-2',  title: 'Apresentar primeiras telas',     owner: 'eu',      waitsOn: false, hint: 'aguardando marcar/realizar reunião' },
  { id: 'col-3',  title: 'Comentários do cliente',         owner: 'cliente', waitsOn: true  },
  { id: 'col-4',  title: 'Realizando ajustes',             owner: 'eu',      waitsOn: false },
  { id: 'col-5',  title: 'Aguardando aprovação (estrutura)',owner: 'cliente', waitsOn: true  },
  { id: 'col-6',  title: 'Design final',                   owner: 'eu',      waitsOn: false, hint: 'conteúdo, plantas, bolotário' },
  { id: 'col-7',  title: 'Aprovação final (conteúdo)',     owner: 'cliente', waitsOn: true  },
  { id: 'col-8',  title: 'Programação (React)',            owner: 'interno', waitsOn: false },
  { id: 'col-9',  title: 'Apresentar sistema',             owner: 'interno', waitsOn: false, hint: 'aguardando marcar/realizar call' },
  { id: 'col-10', title: 'Ajustes na programação',         owner: 'interno', waitsOn: false },
  { id: 'col-11', title: 'Instalação pendente',            owner: 'cliente', waitsOn: true,  hint: 'logística do totem' },
  { id: 'col-12', title: 'Feature pendente',               owner: 'interno', waitsOn: false, hint: 'instalado, mas incompleto' },
  { id: 'col-13', title: 'Instalação concluída',           owner: 'interno', waitsOn: false },
];

export const OWNER_LABELS = {
  eu:      { text: 'Eu',      short: 'EU'  },
  cliente: { text: 'Cliente', short: 'CLI' },
  interno: { text: 'Interno', short: 'INT' },
};

export function createEmptyBoard() {
  const columns = {};
  const columnOrder = [];
  COLUMN_DEFS.forEach((col) => {
    columns[col.id] = { ...col, cardIds: [] };
    columnOrder.push(col.id);
  });
  return { columns, cards: {}, columnOrder };
}

export function createCard(overrides = {}) {
  const id = `card-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    id,
    title: '',
    clientName: '',      // nome do responsável/cliente
    emails: [],          // array de strings de e-mail
    cityState: '',       // "Cidade – UF"
    owner: 'eu',
    dueDate: null,
    notes: '',
    doneItems: [],
    pendingItems: [],
    checklist: [],       // [{ id, text, done }]
    tags: { totemPrevio: false },
    createdAt: Date.now(),
    ...overrides,
  };
}
