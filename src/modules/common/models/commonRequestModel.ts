class CommonRequestModel {
  public fromDate!: Date;
  public toDate!: Date;
  public currentPage!: number;
  public pageSize!: number;
  public searchText!: string;
  public totalRows!: number;
  public filterRowsCount!: number;
  public orderBy!: string;
  public orderType!: string;
  constructor() {
    this.fromDate = new Date();
    this.toDate = new Date();
    this.currentPage = 1;
    this.pageSize = 10;
    this.searchText = "";
    this.totalRows = 0;
    this.filterRowsCount = 0;
    this.orderBy = "createdon";
    this.orderType = "DESC";
  }
}

export default CommonRequestModel;
