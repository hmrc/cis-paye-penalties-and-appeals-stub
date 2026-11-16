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

import org.apache.pekko.actor.ActorSystem
import org.scalatest.freespec.AnyFreeSpec
import org.scalatest.matchers.should.Matchers
import org.scalatestplus.play.guice.GuiceOneServerPerSuite
import play.api.libs.json.Json
import play.api.test.FakeRequest
import play.api.test.Helpers.*

class ClientListControllerSpec extends AnyFreeSpec
  with Matchers
  with GuiceOneServerPerSuite {

  implicit val system: ActorSystem = app.actorSystem

  lazy val controller: ClientListController = app.injector.instanceOf[ClientListController]

  "ClientListController" - {
    ".getClientListDownloadStatus" - {
      "return Succeeded by default" in {
        val result = controller.getClientListDownloadStatus("uname1", "CIS", 14400)(FakeRequest("GET", "/"))
        status(result) shouldBe OK
        contentAsJson(result) shouldBe Json.obj("status" -> "Succeeded")
      }

      "return Failed for the clientlist-failed credential" in {
        val result = controller.getClientListDownloadStatus("clientlist-failed", "CIS", 14400)(FakeRequest("GET", "/"))
        contentAsJson(result) shouldBe Json.obj("status" -> "Failed")
      }

      "return InProgress for the clientlist-inprogress credential" in {
        val result = controller.getClientListDownloadStatus("clientlist-inprogress", "CIS", 14400)(FakeRequest("GET", "/"))
        contentAsJson(result) shouldBe Json.obj("status" -> "InProgress")
      }
    }

    ".hasClient" - {
      "return hasClient true by default" in {
        val result = controller.hasClient("123456", "uname1", "123", "AB456", "CIS")(FakeRequest("GET", "/"))
        status(result) shouldBe OK
        contentAsJson(result) shouldBe Json.obj("hasClient" -> true)
      }

      "return hasClient false for the NOCLIENT tax office reference" in {
        val result = controller.hasClient("123456", "uname1", "123", "NOCLIENT", "CIS")(FakeRequest("GET", "/"))
        contentAsJson(result) shouldBe Json.obj("hasClient" -> false)
      }
    }
  }
}
