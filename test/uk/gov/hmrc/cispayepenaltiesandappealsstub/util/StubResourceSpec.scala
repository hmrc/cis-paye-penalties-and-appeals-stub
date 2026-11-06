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

package uk.gov.hmrc.cispayepenaltiesandappealsstub.util

import org.scalatest.matchers.should.Matchers
import org.scalatest.wordspec.AnyWordSpec
import org.scalatestplus.mockito.MockitoSugar
import org.scalatestplus.play.guice.GuiceOneServerPerSuite
import play.api.http.Status
import play.api.mvc.*
import play.api.test.Helpers.*

import javax.inject.Inject
import scala.concurrent.{ExecutionContext, Future}

class TestStubResourceController @Inject()(cc: ControllerComponents)(implicit val executionContext: ExecutionContext)
  extends AbstractController(cc) with StubResource

class StubResourceSpec
  extends AnyWordSpec
    with Matchers
    with GuiceOneServerPerSuite
    with MockitoSugar:

  lazy val testController: TestStubResourceController = app.injector.instanceOf[TestStubResourceController]

  "jsonResourceAsResponse" should:
    "return Ok with JSON content when resource exists" in:
      val result = Future.successful(testController.jsonResourceAsResponse("/test-resource.json"))
      status(result) shouldBe Status.OK
      contentType(result) shouldBe Some("application/json")

    "return NotFound when resource does not exist" in:
      val result = Future.successful(testController.jsonResourceAsResponse("/non-existent.json"))
      status(result) shouldBe Status.NOT_FOUND

  "resourceAsResponse" should:
    "return Ok with specified mime type when resource exists" in:
      val result = Future.successful(testController.resourceAsResponse("/test-resource.json", "application/xml"))
      status(result) shouldBe Status.OK
      contentType(result) shouldBe Some("application/xml")

    "return NotFound when resource does not exist" in:
      val result = Future.successful(testController.resourceAsResponse("/missing-file.json", "application/json"))
      status(result) shouldBe Status.NOT_FOUND

  "errorAsJsonResponse" should:
    "return NotFound with JSON content type for 404 status" in:
      val result = Future.successful(testController.errorAsJsonResponse(Status.NOT_FOUND, """{"error":"not found"}"""))
      status(result) shouldBe Status.NOT_FOUND
      contentType(result) shouldBe Some("application/json")
      contentAsString(result) shouldBe """{"error":"not found"}"""

    "return BadRequest with JSON content type for 400 status" in:
      val result = Future.successful(testController.errorAsJsonResponse(Status.BAD_REQUEST, """{"error":"bad request"}"""))
      status(result) shouldBe Status.BAD_REQUEST
      contentType(result) shouldBe Some("application/json")
      contentAsString(result) shouldBe """{"error":"bad request"}"""

    "return UnprocessableEntity with JSON content type for 422 status" in:
      val result = Future.successful(testController.errorAsJsonResponse(Status.UNPROCESSABLE_ENTITY, """{"error":"unprocessable"}"""))
      status(result) shouldBe Status.UNPROCESSABLE_ENTITY
      contentType(result) shouldBe Some("application/json")
      contentAsString(result) shouldBe """{"error":"unprocessable"}"""

    "return Unauthorized with JSON content type for 401 status" in:
      val result = Future.successful(testController.errorAsJsonResponse(Status.UNAUTHORIZED, """{"error":"unauthorized"}"""))
      status(result) shouldBe Status.UNAUTHORIZED
      contentType(result) shouldBe Some("application/json")
      contentAsString(result) shouldBe """{"error":"unauthorized"}"""

    "return InternalServerError with JSON content type for any other status" in:
      val result = Future.successful(testController.errorAsJsonResponse(Status.SERVICE_UNAVAILABLE, """{"error":"server error"}"""))
      status(result) shouldBe Status.INTERNAL_SERVER_ERROR
      contentType(result) shouldBe Some("application/json")
      contentAsString(result) shouldBe """{"error":"server error"}"""

    "return InternalServerError with JSON content type for 500 status" in:
      val result = Future.successful(testController.errorAsJsonResponse(Status.INTERNAL_SERVER_ERROR, """{"error":"internal error"}"""))
      status(result) shouldBe Status.INTERNAL_SERVER_ERROR
      contentType(result) shouldBe Some("application/json")

  "findResource" should:
    "return Some with file content when resource exists" in:
      val result = testController.findResource("/test-resource.json")
      result shouldBe defined
      result.get should not be empty

    "return None when resource does not exist" in:
      val result = testController.findResource("/does-not-exist.json")
      result shouldBe None

    "return None and log warning when resource path is invalid" in:
      val result = testController.findResource("/invalid/path/file.json")
      result shouldBe None