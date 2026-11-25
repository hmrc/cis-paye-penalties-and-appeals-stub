/*
 * Copyright 2025 HM Revenue & Customs
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

import models.GetAppealablePenaltyItem
import play.api.Logging
import play.api.http.{ContentTypes, Status}
import play.api.libs.json.Json
import play.api.mvc.*
import play.api.mvc.Results.UnprocessableEntity

import java.io.InputStream
import scala.concurrent.ExecutionContext
import scala.io.Source
import scala.util.Try

trait StubResource extends Results with ContentTypes with Status with Logging {

  implicit def executionContext: ExecutionContext

  def jsonResourceAsResponse(path: String): Result = resourceAsResponse(path, JSON)

  def resourceAsResponse(path: String, mimeType: String): Result =
    findResource(path) match {
      case Some(content) => Ok(content).as(mimeType)
      case _             => NotFound
    }

  def errorAsJsonResponse(status: Int, content: String): Result = errorAsResponse(status, content, JSON)

  private def errorAsResponse(status: Int, content: String, mimeType: String): Result =
    status match {
      case NOT_FOUND            => NotFound(content).as(mimeType)
      case BAD_REQUEST          => BadRequest(content).as(mimeType)
      case UNPROCESSABLE_ENTITY => UnprocessableEntity(content).as(mimeType)
      case UNAUTHORIZED => Unauthorized(content).as(mimeType)
      case _                    => InternalServerError(content).as(mimeType)
    }

  def findResource(path: String): Option[String] = {
    val resource = getClass.getResourceAsStream(path)
    if (resource == null) {
      logger.warn(s"Could not find resource '$path'")
      None
    } else {
      Some(readStreamToString(resource))
    }
  }

  private def readStreamToString(is: InputStream): String =
    try Source.fromInputStream(is).mkString
    finally is.close()

  // Penalties helpers
  val basePath = "/resources/data/pas"

  def getAllPenalties(service: String, hmrcOfficeNumber: String, schemeReferenceNumber: String): Option[List[GetAppealablePenaltyItem]] = {
    val fullPath = s"$basePath/$service/$hmrcOfficeNumber/$schemeReferenceNumber/penalties.json"

    for {
      content <- findResource(fullPath)
      json <- Try(Json.parse(content)).toOption
      penalties <- json.validate[List[GetAppealablePenaltyItem]].asOpt
    } yield penalties
  }

  def getPenaltyById(service: String, hmrcOfficeNumber: String, schemeReferenceNumber: String, penaltyId: Long): Option[GetAppealablePenaltyItem] = {
    getAllPenalties(service, hmrcOfficeNumber, schemeReferenceNumber).flatMap { penalties =>
      penalties.find(_.penaltyId == penaltyId)
    }
  }
}
