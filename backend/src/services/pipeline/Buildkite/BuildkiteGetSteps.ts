import axios from "axios";
import { PipelineGetSteps } from "../PipelineGetSteps";
import { PipelineGetStepsRequest } from "../../../contract/pipeline/PipelineGetStepsRequest";
import { PipelineInfo } from "../../../contract/pipeline/PipelineInfo";
import { JsonConvert } from "json2typescript";
import { FetchParams } from "../../../types/FetchParams";
import {
  BKBuildInfo,
  BKJobInfo,
} from "../../../models/pipeline/Buildkite/BKBuildInfo";
import parseLinkHeader from "parse-link-header";

export class BuildkiteGetSteps implements PipelineGetSteps {
  private static permissions = [
    "read_builds",
    "read_organizations",
    "read_pipelines",
  ];
  private httpClient = axios.create({
    baseURL: "https://api.buildkite.com/v2",
  });

  constructor(token: string) {
    this.httpClient.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${token}`;
  }

  async fetchPipelineInfo(
    pipelineGetStepsRequest: PipelineGetStepsRequest
  ): Promise<PipelineInfo> {
    const jsonConvert = new JsonConvert();
    const fetchURL = `/organizations/${pipelineGetStepsRequest.orgId}/pipelines/${pipelineGetStepsRequest.pipelineId}/builds`;
    const fetchParams: FetchParams = new FetchParams(
      "1",
      "100",
      new Date(pipelineGetStepsRequest.startTime),
      new Date(pipelineGetStepsRequest.endTime)
    );
    const pipelineBuilds: [] = await this.fetchDataPageByPage(
      fetchURL,
      fetchParams
    );
    const bkBuildInfoList: BKBuildInfo[] = jsonConvert.deserializeArray(
      pipelineBuilds,
      BKBuildInfo
    );
    const bkJobInfoList = new Set<BKJobInfo>();
    bkBuildInfoList.forEach((buildInfo) => {
      buildInfo.jobs.forEach((job) => {
        bkJobInfoList.add(job);
      });
    });
    const jobs = [...bkJobInfoList];
    const bkEffectiveSteps = jobs
      .filter(
        (job) => job != undefined && job.name != undefined && job.name != ""
      )
      .map((job) => job.name!)
      .sort((a: string, b: string) => {
        return a!.localeCompare(b!);
      });

    return new PipelineInfo(
      pipelineGetStepsRequest.pipelineId,
      pipelineGetStepsRequest.pipelineName,
      bkEffectiveSteps,
      pipelineGetStepsRequest.repository,
      pipelineGetStepsRequest.orgId,
      pipelineGetStepsRequest.orgName
    );
  }
  private async fetchDataPageByPage(
    fetchURL: string,
    fetchParams: FetchParams
  ): Promise<[]> {
    const dataCollector: [] = [];
    const response = await this.httpClient.get(fetchURL, {
      params: fetchParams,
    });
    const dataFromTheFirstPage: [] = response.data;
    dataCollector.push(...dataFromTheFirstPage);
    const links = parseLinkHeader(response.headers["link"]);
    const totalPage: string =
      links != null && links["last"] != null ? links["last"].page : "1";
    if (totalPage != "1") {
      await Promise.all(
        [...Array(Number(totalPage)).keys()].map(async (index) => {
          if (index == 0) return;
          return this.httpClient
            .get(fetchURL, {
              params: { ...fetchParams, page: String(index + 1) },
            })
            .then((response) => {
              const dataFromOnePage: [] = response.data;
              dataCollector.push(...dataFromOnePage);
            });
        })
      );
    }
    return dataCollector;
  }
}
