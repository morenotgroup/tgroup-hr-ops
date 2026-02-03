import "server-only";

export type PjStatus = "Pendente" | "Em análise" | "Aprovado" | "Pago";

export type PjClosingItem = {
  id: string;
  parceiro: string;
  area: string;
  competencia: string;
  valor: number;
  status: PjStatus;
  risco: "Baixo" | "Médio" | "Alto";
};

export type RescisaoCase = {
  colaborador: string;
  cargo: string;
  admissao: string;
  desligamento: string;
  motivo: string;
  salarioBase: number;
  saldoFgts: number;
  avisoPrevio: number;
  feriasProporcionais: number;
  decimoTerceiro: number;
  descontos: number;
};

export type FeriasResumo = {
  saldoDias: number;
  vencidasDias: number;
  proximaCompetencia: string;
  demonstrativos: Array<{
    colaborador: string;
    periodo: string;
    dias: number;
    status: "Em aberto" | "Programada" | "Vencida";
  }>;
};

export type DpSnapshot = {
  pj: {
    itens: PjClosingItem[];
    filtros: {
      competencias: string[];
      areas: string[];
      status: PjStatus[];
    };
  };
  rescisao: {
    casoAtual: RescisaoCase;
  };
  ferias: FeriasResumo;
};

const MOCK_SNAPSHOT: DpSnapshot = {
  pj: {
    itens: [
      {
        id: "PJ-221",
        parceiro: "Camila R.",
        area: "Marketing",
        competencia: "Ago/2024",
        valor: 12800,
        status: "Em análise",
        risco: "Médio",
      },
      {
        id: "PJ-238",
        parceiro: "Studio Lima",
        area: "Design",
        competencia: "Ago/2024",
        valor: 18900,
        status: "Aprovado",
        risco: "Baixo",
      },
      {
        id: "PJ-245",
        parceiro: "Rafa M.",
        area: "Conteúdo",
        competencia: "Set/2024",
        valor: 9400,
        status: "Pendente",
        risco: "Alto",
      },
      {
        id: "PJ-251",
        parceiro: "Agência Pulse",
        area: "Performance",
        competencia: "Set/2024",
        valor: 21500,
        status: "Pago",
        risco: "Baixo",
      },
      {
        id: "PJ-263",
        parceiro: "Kai V.",
        area: "Produto",
        competencia: "Set/2024",
        valor: 15200,
        status: "Em análise",
        risco: "Médio",
      },
    ],
    filtros: {
      competencias: ["Ago/2024", "Set/2024"],
      areas: ["Marketing", "Design", "Conteúdo", "Performance", "Produto"],
      status: ["Pendente", "Em análise", "Aprovado", "Pago"],
    },
  },
  rescisao: {
    casoAtual: {
      colaborador: "Ana Souza",
      cargo: "Analista de Operações",
      admissao: "15/03/2021",
      desligamento: "20/09/2024",
      motivo: "Acordo mútuo",
      salarioBase: 6200,
      saldoFgts: 8900,
      avisoPrevio: 3100,
      feriasProporcionais: 1850,
      decimoTerceiro: 2400,
      descontos: 960,
    },
  },
  ferias: {
    saldoDias: 18,
    vencidasDias: 6,
    proximaCompetencia: "Nov/2024",
    demonstrativos: [
      {
        colaborador: "Natan C.",
        periodo: "2023/2024",
        dias: 30,
        status: "Programada",
      },
      {
        colaborador: "Bruna L.",
        periodo: "2022/2023",
        dias: 15,
        status: "Vencida",
      },
      {
        colaborador: "Paula F.",
        periodo: "2023/2024",
        dias: 12,
        status: "Em aberto",
      },
    ],
  },
};

export async function getDpSnapshot(): Promise<DpSnapshot> {
  return MOCK_SNAPSHOT;
}
