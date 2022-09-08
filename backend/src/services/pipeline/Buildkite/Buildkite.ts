import { Pipeline } from "../Pipeline";
import axios from "axios";
import { BKTokenInfo } from "../../../models/pipeline/Buildkite/BKTokenInfo";
import { BKOrganizationInfo } from "../../../models/pipeline/Buildkite/BKOrganizationInfo";
import { PipelineInfo } from "../../../contract/pipeline/PipelineInfo";
import { BKPipelineInfo } from "../../../models/pipeline/Buildkite/BKPipelineInfo";
import { BuildInfo } from "../../../models/pipeline/BuildInfo";
import { BKBuildInfo } from "../../../models/pipeline/Buildkite/BKBuildInfo";
import { DeployInfo, DeployTimes } from "../../../models/pipeline/DeployTimes";
import { JsonConvert } from "json2typescript";
import parseLinkHeader from "parse-link-header";
import { DeploymentEnvironment } from "../../../contract/GenerateReporter/GenerateReporterRequestBody";
import { FetchParams } from "../../../types/FetchParams";

export class Buildkite implements Pipeline {
  private static permissions = [
    "read_builds",
    "read_organizations",
    "read_pipelines",
  ];
  private httpClient = axios.create({
    baseURL: "https://api.buildkite.com/v2",
  });

  private jsonConvert = new JsonConvert();

  constructor(token: string) {
    this.httpClient.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${token}`;
  }

  async verifyToken(): Promise<boolean> {
    const axiosResponse = await this.httpClient.get("/access-token");
    const tokenInfo: BKTokenInfo = axiosResponse.data;
    for (const index in Buildkite.permissions) {
      if (!tokenInfo.scopes.includes(Buildkite.permissions[index])) {
        return false;
      }
    }
    return true;
  }

  async getRepositories(
    deployments: DeploymentEnvironment[]
  ): Promise<Map<string, string>> {
    const result: Map<string, string> = new Map();
    await Promise.all(
      deployments.map(async (deployment) => {
        const axiosResponse = await this.httpClient.get(
          `/organizations/${deployment.orgId}/pipelines/${deployment.id}`
        );
        result.set(deployment.id, axiosResponse.data.repository);
      })
    );
    return result;
  }

  async fetchPipelineInfo(
    startTime: number,
    endTime: number
  ): Promise<PipelineInfo[]> {
    const pipelines: PipelineInfo[] = [];
    const orgResponse = await this.httpClient.get("/organizations");
    const organizations: BKOrganizationInfo[] = orgResponse.data;

    await Promise.all(
      organizations.map((organization) => {
        return this.fetchPipelineInfoInOrganization(
          pipelines,
          organization,
          startTime,
          endTime
        );
      })
    );

    return pipelines;
  }

  private async fetchPipelineInfoInOrganization(
    pipelines: PipelineInfo[],
    organization: BKOrganizationInfo,
    startTime: number,
    endTime: number
  ) {
    const organizationId = organization.slug;
    const pipelineInfoFetchUrl = `/organizations/${organizationId}/pipelines`;
    const pipelineInfoFetchParams: FetchParams = {
      page: "1",
      per_page: "100",
      finished_from: new Date(startTime),
      created_to: new Date(endTime),
    };

    const pipelineInfoList = await this.fetchDataPageByPage(
      pipelineInfoFetchUrl,
      pipelineInfoFetchParams
    );

    const bkPipelineInfos: BKPipelineInfo[] = this.jsonConvert.deserializeArray(
      pipelineInfoList,
      BKPipelineInfo
    );

    const pipelinesOfOrganization = bkPipelineInfos
      .sort((a: BKPipelineInfo, b: BKPipelineInfo) => {
        return a.name.localeCompare(b.name);
      })
      .map((pipelineInfo) => {
        const bkEffectiveSteps: string[] = [];
        return pipelineInfo.mapToDeployInfo(
          organizationId,
          organization.name,
          bkEffectiveSteps
        );
      });
    pipelines.push(...pipelinesOfOrganization);
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
        [...Array(Number(totalPage)).keys()].map((index) => {
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

  async countDeployTimes(
    deploymentEnvironment: DeploymentEnvironment,
    buildInfos: BuildInfo[]
  ): Promise<DeployTimes> {
    if (deploymentEnvironment.orgId == null) {
      throw Error("miss orgId argument");
    }

    const passedBuilds: DeployInfo[] = this.getBuildsByState(
      buildInfos,
      deploymentEnvironment,
      "passed"
    );
    const failedBuilds: DeployInfo[] = this.getBuildsByState(
      buildInfos,
      deploymentEnvironment,
      "failed"
    );

    return new DeployTimes(
      deploymentEnvironment.id,
      deploymentEnvironment.name,
      deploymentEnvironment.step,
      passedBuilds,
      failedBuilds
    );
  }

  private getBuildsByState(
    buildInfos: BuildInfo[],
    deploymentEnvironment: DeploymentEnvironment,
    ...state: string[]
  ): DeployInfo[] {
    return buildInfos
      .map((build) =>
        build.mapToDeployInfo(deploymentEnvironment.step, ...state)
      )
      .filter((job) => job.jobStartTime != "");
  }

  async fetchPipelineBuilds(
    deploymentEnvironment: DeploymentEnvironment,
    startTime: Date,
    endTime: Date
  ): Promise<BuildInfo[]> {
    const fetchURL = `/organizations/${deploymentEnvironment.orgId}/pipelines/${deploymentEnvironment.id}/builds`;
    const fetchParams: FetchParams = {
      page: "1",
      per_page: "100",
      finished_from: startTime,
      created_to: endTime,
    };

    const pipelineBuilds: [] = await this.fetchDataPageByPage(
      fetchURL,
      fetchParams
    );
    return this.jsonConvert
      .deserializeArray(pipelineBuilds, BKBuildInfo)
      .map((buildInfo) => new BuildInfo(buildInfo));
  }
}
