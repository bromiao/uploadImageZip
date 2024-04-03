
declare module 'file-saver' {
    function saveAs(blob: Blob, fileName: string,quality?:string | number): void;
    namespace saveAs {}
  }
