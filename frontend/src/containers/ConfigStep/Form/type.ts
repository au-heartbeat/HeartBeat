export type TBoardFieldKeys = 'type' | 'boardId' | 'email' | 'site' | 'token';
export type TPipelineToolFieldKeys = 'type' | 'token';
export type TSourceControlFieldKeys = 'type' | 'token';
export interface IBoardConfigErrorMessage extends Record<Exclude<TBoardFieldKeys, 'type'>, Record<string, string>> {
  boardId: {
    required: string;
    invalid: string;
    verifyFailed: string;
  };
  email: {
    required: string;
    invalid: string;
    verifyFailed: string;
  };
  site: {
    required: string;
    verifyFailed: string;
  };
  token: {
    required: string;
    invalid: string;
    verifyFailed: string;
    timeout: string;
    [other: string]: string;
  };
}
export interface IPipelineToolErrorMessage
  extends Record<Exclude<TPipelineToolFieldKeys, 'type'>, Record<string, string>> {
  token: {
    required: string;
    invalid: string;
    unauthorized: string;
    forbidden: string;
    timeout: string;
    [other: string]: string;
  };
}
export interface ISourceControlErrorMessage
  extends Record<Exclude<TSourceControlFieldKeys, 'type'>, Record<string, string>> {
  token: {
    required: string;
    invalid: string;
    unauthorized: string;
    timeout: string;
    [other: string]: string;
  };
}
