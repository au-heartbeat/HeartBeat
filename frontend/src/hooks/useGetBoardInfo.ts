import { useState } from 'react';
import { boardInfoClient } from '@src/clients/board/BoardInfoClient';
import { BoardInfoRequestDTO } from '@src/clients/board/dto/request';
import { AxiosResponse } from 'axios';
import { BOARD_CONFIG_INFO_ERROR, BOARD_CONFIG_INFO_TITLE } from '@src/constants/resources';
import get from 'lodash/get';

export type JiraColumns = Record<string, string>[];
export type TargetFields = Record<string, string>[];
export type Users = string[];
export interface BoardInfoResponse {
  jiraColumns: JiraColumns;
  targetFields: TargetFields;
  users: Users;
}
export interface useGetBoardInfoInterface {
  getBoardInfo: (data: BoardInfoRequestDTO) => Promise<AxiosResponse<BoardInfoResponse>>;
  isLoading: boolean;
  errorMessage: Record<string, string>;
}

const codeMapping = {
  400: {
    title: BOARD_CONFIG_INFO_TITLE.INVALID_INPUT,
    message: BOARD_CONFIG_INFO_ERROR.NOT_FOUND,
  },
  401: {
    title: BOARD_CONFIG_INFO_TITLE.UNAUTHORIZED_REQUEST,
    message: BOARD_CONFIG_INFO_ERROR.NOT_FOUND,
  },
  403: {
    title: BOARD_CONFIG_INFO_TITLE.FORBIDDEN_REQUEST,
    message: BOARD_CONFIG_INFO_ERROR.FORBIDDEN,
  },
  404: {
    title: BOARD_CONFIG_INFO_TITLE.NOT_FOUND,
    message: BOARD_CONFIG_INFO_ERROR.NOT_FOUND,
  },
};

export const useGetBoardInfoEffect = (): useGetBoardInfoInterface => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState({});
  const getBoardInfo = (data: BoardInfoRequestDTO) => {
    setIsLoading(true);
    setErrorMessage({});
    return boardInfoClient
      .getBoardInfo(data)
      .then((res) => {
        if (!res.data) {
          setErrorMessage({
            title: 'No card within selected date range!',
            message: 'Please go back to the previous page and change your collection date, or check your board info!',
          });
        }
        return res;
      })
      .catch((err) => {
        const { code } = err;
        setErrorMessage(get(codeMapping, code, {}));
        return err;
      })
      .finally(() => setIsLoading(false));
  };
  return {
    getBoardInfo,
    errorMessage,
    isLoading,
  };
};
