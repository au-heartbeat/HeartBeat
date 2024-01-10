import { BadRequestException } from '@src/exceptions/BadRequestException';
import { UnauthorizedException } from '@src/exceptions/UnauthorizedException';
import { ForbiddenException } from '@src/exceptions/ForbiddenException';
import { NotFoundException } from '@src/exceptions/NotFoundException';
import { InternalServerException } from '@src/exceptions/InternalServerException';
import { TimeoutException } from '@src/exceptions/TimeoutException';
import { UnknownException } from '@src/exceptions/UnkonwException';

export const isHeartBeatException = (o: unknown) =>
  [
    BadRequestException,
    UnauthorizedException,
    ForbiddenException,
    NotFoundException,
    InternalServerException,
    TimeoutException,
    UnknownException,
  ].some((excptionClass) => o instanceof excptionClass);
