export interface Response {
    Tables: Table[];
}

export interface Table {
    TableName: string;
    Columns: Column[];
    Rows: (number | string)[][];
}

export interface Column {
    ColumnName: string;
    DataType: string;
    ColumnType: string;
}
