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

import jakarta.inject.Singleton
import models.*
import play.api.Logging
import play.api.libs.json.{JsValue, Json}
import play.api.mvc.{Action, ControllerComponents}
import uk.gov.hmrc.cispayepenaltiesandappealsstub.util.StubResource
import uk.gov.hmrc.play.bootstrap.backend.controller.BackendController

import javax.inject.Inject
import scala.concurrent.{ExecutionContext, Future}
import scala.util.Try

@Singleton
class ManageCisController @Inject()(cc: ControllerComponents, override val executionContext: ExecutionContext)
  extends BackendController(cc) with StubResource with Logging {

  val basePath = "/resources/data/pas/cis"

  def createCisAppeal: Action[JsValue] = Action.async(parse.json) { implicit request =>
    request.body.validate[CreateAppealRequest].fold(
      invalid =>
        logger.error(s"[ManageCisController][createCisAppeal]: Failed to validate payload, errors: $invalid")
        Future.successful(BadRequest(Json.obj("message" -> s"Invalid payload: $invalid"))),
      payload => {
        val fullPath = "/resources/data/pas/createAppealResponse.json"

        findResource(fullPath) match {
          case Some(content) => Future.successful(jsonResourceAsResponse(fullPath))
          case _ => Future.successful(NotFound)
        }
      }
    )
  }

  def getCisAppealablePenalties: Action[JsValue] = Action.async(parse.json) { implicit request =>
    request.body.validate[GetAppealablePenaltiesRequest].fold(
      invalid => {
        logger.error(s"[ManageCisController][getCisAppealablePenalty]: Failed to validate payload, errors: $invalid")
        Future.successful(BadRequest(Json.obj("message" -> s"Invalid payload: $invalid")))
      },
      payload => {
        getAllPenalties(payload.hmrcOfficeNumber, payload.schemeReferenceNumber) match {
          case Some(penalties) =>
            val sortedPenalties = penalties.sortBy(_.penaltyId.getOrElse(0L))(Ordering[Long].reverse)

            val startIndex = (payload.startRow - 1).toInt.max(0)
            val endIndex   = payload.endRow.toInt
            val paginatedSlice = sortedPenalties.slice(startIndex, endIndex)

            val responseBody = GetAppealablePenaltiesResponse(
              total = penalties.size,
              appealablePenalties = paginatedSlice
            )

            Future.successful(Ok(Json.toJson(responseBody)))
          case None =>
            Future.successful(NotFound)
        }
      }
    )
  }

  def getCisAppealablePenalty: Action[JsValue] = Action.async(parse.json) { implicit request =>
    request.body.validate[GetAppealablePenaltyRequest].fold(
      invalid => {
        logger.error(s"[ManageCisController][getCisAppealablePenalty]: Failed to validate payload, errors: $invalid")
        Future.successful(BadRequest(Json.obj("message" -> s"Invalid payload: $invalid")))
      },
      payload => {
        getPenaltyById(payload.hmrcOfficeNumber, payload.schemeReferenceNumber, payload.penaltyId) match {
          case Some(penalty) =>
            Future.successful(Ok(Json.toJson(penalty.copy(penaltyId = None))))
          case None =>
            Future.successful(NotFound)
        }
      }
    )
  }

  def getCisTaxpayer: Action[JsValue] = Action.async(parse.json) { implicit request =>
    request.body.validate[GetCisTaxpayerRequest].fold(
      invalid =>
        logger.error(s"[ManageCisController][getCisTaxpayer]: Failed to validate payload, errors: $invalid")
        Future.successful(BadRequest(Json.obj("message" -> s"Invalid payload: $invalid"))),
      payload => {
        val fullPath = s"$basePath/${payload.taxOfficeNumber}/${payload.taxOfficeReference}/taxpayerByEmployerRef.json"

        findResource(fullPath) match {
          case Some(content) => Future.successful(jsonResourceAsResponse(fullPath))
          case _ => Future.successful(NotFound)
        }
      }
    )
  }

  def getCisPenaltyAllowed: Action[JsValue] = Action.async(parse.json) { implicit request =>
    request.body.validate[GetPenaltyAllowedRequest].fold(
      invalid =>
        logger.error(s"[ManageCisController][getCisPenaltyAllowed]: Failed to validate payload, errors: $invalid")
        Future.successful(BadRequest(Json.obj("message" -> s"Invalid payload: $invalid"))),
      payload => {
        val stubFileName = payload.penaltyId match {
          case 1 => "penaltyNotAllowed"
          case _ => "penaltyAllowed"
        }

        val fullPath = s"/resources/data/pas/$stubFileName.json"

        findResource(fullPath) match {
          case Some(content) => Future.successful(jsonResourceAsResponse(fullPath))
          case _ => Future.successful(NotFound)
        }
      }
    )
  }

  private def getAllPenalties(hmrcOfficeNumber: String, schemeReferenceNumber: String): Option[List[GetAppealablePenaltyResponse]] = {
    val fullPath = s"$basePath/$hmrcOfficeNumber/$schemeReferenceNumber/penalties.json"

    for {
      content <- findResource(fullPath)
      json <- Try(Json.parse(content)).toOption
      penalties <- json.validate[List[GetAppealablePenaltyResponse]].asOpt
    } yield penalties
  }

  private def getPenaltyById(hmrcOfficeNumber: String, schemeReferenceNumber: String, penaltyId: Long): Option[GetAppealablePenaltyResponse] = {
    getAllPenalties(hmrcOfficeNumber, schemeReferenceNumber).flatMap { penalties =>
      penalties.find(_.penaltyId.contains(penaltyId))
    }
  }
}
