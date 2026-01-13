export interface AptrProject {
  id: string;
  number: string;
  status: string;
  serviceId: string;
  address: string;
  object: string;
  aptrObjectId: string;
  tbId: string;
  aptrTbId: string;
  gosbId: string;
  aptrGosbId: string | null;
  floor: string;
  room: string;
  year: string;
  quarter: string;
  customer: string;
  typeRepair: string;
  info: string;
  summ: number;
  dtEnd: string | null;
  author: string;
  files: Array<{
    fileId: string;
    fileName: string;
  }>;
}

export interface AptrBudgetObject {
  id: string;
  object: string;
  planBidget: string;
  quarter: string;
  year: string;
  customer: string;
  aptrProjects: AptrProject[];
}

export interface AptrBudgetGosb {
  id: string;
  gosbId: string;
  planBidget: string;
  quarter: string;
  year: string;
  customer: string;
  aptrBudgetObjects: AptrBudgetObject[];
}

export interface Territory {
  id: string;
  tbId: string;
  planBudget: string;
  quarter: string;
  year: string;
  customer: string;
  aptrBudgetGosbs: AptrBudgetGosb[];
}

export interface DashboardData {
  content: Territory[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalPages: number;
  totalElements: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  numberOfElements: number;
  first: boolean;
  empty: boolean;
}

export interface TableRow {
  key: string;
  name: string;
  requirements?: number;
  cost?: number;
  budget?: number;
  deviation?: number;
  deviationPercent?: number;
  children?: TableRow[];
  isProject?: boolean;
  isSummary?: boolean;
  projectNumber?: string;
  projectCustomer?: string;
  projectQuarter?: string;
  projectStatus?: string;
}
