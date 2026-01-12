interface BudgetFile {
  fileName: string;
  fileId: string;
}

interface Project {
  id: string;
  number: string;
  status: string;
  address: string;
  object: string;
  aptr_object_id: string;
  tbId: string;
  aptr_tb_id: string;
  gosbId: string;
  aptr_gosb_id: string;
  floor: string;
  room: string;
  year: string;          // остаётся только здесь
  quarter: string;       // остаётся только здесь
  customer: string;      // остаётся только здесь
  typeRepair: string;
  info: string;
  summ: string;
  dtInsert: string;      // предполагается, что "data" — это строка (например, ISO-дата)
  files: BudgetFile[];
}

interface BudgetObject {
  id: string;
  aptrGosbId: string;
  object: string;
  projects: Project[];
}

interface BudgetGosb {
  id: string;
  aptrTbId: string;
  gosbId: string;
  planBudget: string;
  objects: BudgetObject[];
}

interface BudgetTb {
  id: string;
  tbId: string;
  planBudget: string;
  budgetGosbs: BudgetGosb[];
}

interface BudgetData {
  budgetTbs: BudgetTb[];
}
