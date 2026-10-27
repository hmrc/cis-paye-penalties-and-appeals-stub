/*
 * Copyright 2026 HM Revenue & Customs
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package uk.gov.hmrc.cispayepenaltiesandappealsstub.controllers

import models.{CreateAppealRequest, GetAppealablePenaltiesRequest, GetAppealablePenaltyRequest, GetTaxpayerRequest}
import org.apache.pekko.actor.ActorSystem
import org.scalatest.freespec.AnyFreeSpec
import org.scalatest.matchers.should.Matchers
import org.scalatestplus.mockito.MockitoSugar
import org.scalatestplus.play.guice.GuiceOneServerPerSuite
import play.api.http.Status
import play.api.libs.json.Json
import play.api.test.FakeRequest
import play.api.test.Helpers.*

class ManageCisControllerSpec extends AnyFreeSpec
  with Matchers
  with GuiceOneServerPerSuite
  with MockitoSugar {

  implicit val system: ActorSystem = app.actorSystem

  lazy val testController: ManageCisController = app.injector.instanceOf[ManageCisController]

  "ManageCisController" - {
    ".createCisAppeal" - {
      val request = CreateAppealRequest(
        penaltyId = 1L
      )

      "return 200 when payload is valid and resource exists" in {
        val validRequest =
          FakeRequest("POST", "/")
            .withHeaders("Content-Type" -> "application/json")
            .withBody(Json.toJson(request))

        val result = testController.createCisAppeal()(validRequest)

        status(result) shouldBe Status.OK
      }

      "return 400 when payload is invalid" in {
        val invalidPayload = Json.obj("wrong" -> "123456")
        val invalidRequest = FakeRequest("POST", "/")
          .withHeaders("Content-Type" -> "application/json")
          .withBody(invalidPayload)

        val result = testController.createCisAppeal()(invalidRequest)

        status(result) shouldBe Status.BAD_REQUEST
        (contentAsJson(result) \ "message").as[String] should include("Invalid payload")
      }

      "return 400 when required fields are missing" in {
        val missingIdRequest =
          FakeRequest("POST", "/")
            .withHeaders("Content-Type" -> "application/json")
            .withBody(Json.toJson(""))

        val result = testController.createCisAppeal()(missingIdRequest)

        status(result) shouldBe Status.BAD_REQUEST
        (contentAsJson(result) \ "message").as[String] should include("Invalid payload")
      }
    }

    ".getCisAppealablePenalties" - {
      val request = GetAppealablePenaltiesRequest(
        hmrcOfficeNumber = "001",
        schemeReferenceNumber = "AB123",
        startRow = 0L,
        endRow = 9L
      )

      "return 200 when payload is valid and resource exists" in {
        val validRequest =
          FakeRequest("POST", "/")
            .withHeaders("Content-Type" -> "application/json")
            .withBody(Json.toJson(request))

        val result = testController.getCisAppealablePenalties(validRequest)

        status(result) shouldBe Status.OK
      }

      "return 400 when payload is invalid" in {
        val invalidPayload = Json.obj("wrong" -> "123456")
        val invalidRequest = FakeRequest("POST", "/")
          .withHeaders("Content-Type" -> "application/json")
          .withBody(invalidPayload)

        val result = testController.getCisAppealablePenalties()(invalidRequest)

        status(result) shouldBe Status.BAD_REQUEST
        (contentAsJson(result) \ "message").as[String] should include("Invalid payload")
      }

      "return 400 when required fields are missing" in {
        val missingIdRequest =
          FakeRequest("POST", "/")
            .withHeaders("Content-Type" -> "application/json")
            .withBody(Json.toJson(""))

        val result = testController.getCisAppealablePenalties()(missingIdRequest)

        status(result) shouldBe Status.BAD_REQUEST
        (contentAsJson(result) \ "message").as[String] should include("Invalid payload")
      }
    }

    ".getCisAppealablePenalty" - {
      val request = GetAppealablePenaltyRequest(
        penaltyId = 1L,
        hmrcOfficeNumber = "001",
        schemeReferenceNumber = "AB123"
      )

      "return 200 when payload is valid and resource exists" in {
        val validRequest =
          FakeRequest("POST", "/")
            .withHeaders("Content-Type" -> "application/json")
            .withBody(Json.toJson(request))

        val result = testController.getCisAppealablePenalty(validRequest)

        status(result) shouldBe Status.OK
      }

      "return 400 when payload is invalid" in {
        val invalidPayload = Json.obj("wrong" -> "123456")
        val invalidRequest = FakeRequest("POST", "/")
          .withHeaders("Content-Type" -> "application/json")
          .withBody(invalidPayload)

        val result = testController.getCisAppealablePenalty()(invalidRequest)

        status(result) shouldBe Status.BAD_REQUEST
        (contentAsJson(result) \ "message").as[String] should include("Invalid payload")
      }

      "return 400 when required fields are missing" in {
        val missingIdRequest =
          FakeRequest("POST", "/")
            .withHeaders("Content-Type" -> "application/json")
            .withBody(Json.toJson(""))

        val result = testController.getCisAppealablePenalty()(missingIdRequest)

        status(result) shouldBe Status.BAD_REQUEST
        (contentAsJson(result) \ "message").as[String] should include("Invalid payload")
      }
    }

    ".getCisTaxpayer" - {
      val request = GetTaxpayerRequest(
        taxOfficeNumber = "001",
        taxOfficeReference = "AB123"
      )

      "return 200 when payload is valid and resource exists" in {
        val validRequest =
          FakeRequest("POST", "/")
            .withHeaders("Content-Type" -> "application/json")
            .withBody(Json.toJson(request))

        val result = testController.getCisTaxpayer(validRequest)

        status(result) shouldBe Status.OK
      }

      "return 400 when payload is invalid" in {
        val invalidPayload = Json.obj("wrong" -> "123456")
        val invalidRequest = FakeRequest("POST", "/")
          .withHeaders("Content-Type" -> "application/json")
          .withBody(invalidPayload)

        val result = testController.getCisTaxpayer()(invalidRequest)

        status(result) shouldBe Status.BAD_REQUEST
        (contentAsJson(result) \ "message").as[String] should include("Invalid payload")
      }

      "return 400 when required fields are missing" in {
        val missingIdRequest =
          FakeRequest("POST", "/")
            .withHeaders("Content-Type" -> "application/json")
            .withBody(Json.toJson(""))

        val result = testController.getCisTaxpayer()(missingIdRequest)

        status(result) shouldBe Status.BAD_REQUEST
        (contentAsJson(result) \ "message").as[String] should include("Invalid payload")
      }
    }
  }
}
