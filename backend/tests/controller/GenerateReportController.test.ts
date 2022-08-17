import "mocha";
import chai from "chai";
import { expect } from "chai";
import chaiHttp = require("chai-http");
import app from "../../src/server";
import { GenerateReporterResponse } from "../../src/contract/GenerateReporter/GenerateReporterResponse";
import { GenerateReportRequest } from "../../src/contract/GenerateReporter/GenerateReporterRequestBody";
import sinon from "sinon";
import { GenerateReportService } from "../../src/services/GenerateReporter/GenerateReportService";
import fs from "fs";

chai.use(chaiHttp);
chai.should();

describe("GenerateReporter", () => {
  it("should return 200 and report data when post data correct", async () => {
    const response = await chai
      .request(app)
      .post("/generateReporter")
      .send(new GenerateReportRequest());
    expect(response.status).equal(200);
    expect(response.body).to.deep.equal({});
  });

  it("should return 400 when request lack required data", async () => {
    const response = await chai
      .request(app)
      .post("/generateReporter")
      .send(new GenerateReporterResponse());
    expect(response.status).equal(400);
  });
});

describe("ExportExcel", () => {
  after(() => {
    fs.unlink("xlsx/test.txt", (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
  });
  it("should return 200  when post timeStamp", async () => {
    fs.writeFile("xlsx/test.txt", "Hello", (err) => {
      if (err) throw err;
    });
    sinon
      .stub(GenerateReportService.prototype, "fetchExcelFileStream")
      .returns(fs.createReadStream("xlsx/test.txt"));
    const response = await chai.request(app).get("/exportExcel?timeStamp=11");
    expect(response.status).equal(200);
    expect(response.header["content-type"]).equal(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    sinon.restore();
  });
});
