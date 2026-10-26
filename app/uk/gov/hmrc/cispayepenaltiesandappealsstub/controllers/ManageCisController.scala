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
import models.{CreateAppealRequest, GetAppealablePenaltiesRequest, GetAppealablePenaltiesResponse, GetAppealablePenaltyRequest, GetAppealablePenaltyResponse, GetTaxpayerRequest}
import play.api.Logging
import play.api.libs.json.{JsError, JsSuccess, JsValue, Json}
import play.api.mvc.{Action, ControllerComponents}
import uk.gov.hmrc.cispayepenaltiesandappealsstub.util.StubResource
import uk.gov.hmrc.play.bootstrap.backend.controller.BackendController

import javax.inject.Inject
import scala.concurrent.{ExecutionContext, Future}
import scala.util.{Failure, Success, Try}

@Singleton
class ManageCisController @Inject()(cc: ControllerComponents, override val executionContext: ExecutionContext)
  extends BackendController(cc) with StubResource with Logging {

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
        logger.error(s"[ManageCisController][getCisAppealablePenalties]: Failed to validate payload, errors: $invalid")
        Future.successful(BadRequest(Json.obj("message" -> s"Invalid payload: $invalid")))
      },
      payload => {
        val fullPath = s"/resources/data/pas/${payload.hmrcOfficeNumber}/${payload.schemeReferenceNumber}/penalties.json"

        findResource(fullPath) match {
          case Some(content) =>
            Try(Json.parse(content)) match {
              case Success(json) =>
                json.validate[List[GetAppealablePenaltyResponse]] match {
                  case JsSuccess(allPenalties, _) =>
                    val totalRecords = allPenalties.size
                    val sortedPenalties = allPenalties.sortBy(_.uniqueId.getOrElse(0L))(Ordering[Long].reverse)

                    val startIndex = (payload.startRow - 1).toInt.max(0)
                    val endIndex   = payload.endRow.toInt
                    val paginatedSlice = sortedPenalties.slice(startIndex, endIndex)

                    val responseBody = GetAppealablePenaltiesResponse(
                      total = totalRecords,
                      appealablePenalties = paginatedSlice
                    )

                    Future.successful(Ok(Json.toJson(responseBody)))

                  case JsError(errors) =>
                    logger.error(s"[ManageCisController][getCisAppealablePenalties]: JSON validation failed: $errors")
                    Future.successful(InternalServerError)
                }
              case Failure(e) =>
                logger.error(s"[ManageCisController][getCisAppealablePenalties]: Failed to parse JSON from $fullPath", e)
                Future.successful(InternalServerError)
            }
          case _ => Future.successful(NotFound)
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
        val fullPath = s"/resources/data/pas/${payload.hmrcOfficeNumber}/${payload.schemeReferenceNumber}/penalties.json"

        findResource(fullPath) match {
          case Some(content) =>
            Try(Json.parse(content)) match {
              case Success(json) =>
                json.validate[List[GetAppealablePenaltyResponse]] match {
                  case JsSuccess(penalties, _) =>
                    penalties.find(_.uniqueId.contains(payload.penaltyId)) match {
                      case Some(penalty) => Future.successful(Ok(Json.toJson(penalty.copy(uniqueId = None))))
                      case _ => Future.successful(NotFound)
                    }
                  case JsError(errors) =>
                    logger.error(s"[ManageCisController][getCisAppealablePenalty]: JSON validation failed: $errors")
                    Future.successful(InternalServerError)
                }
              case Failure(e) =>
                logger.error(s"[ManageCisController][getCisAppealablePenalty]: Failed to parse JSON from $fullPath", e)
                Future.successful(InternalServerError)
            }
          case _ => Future.successful(NotFound)
        }
      }
    )
  }

  def getCisTaxpayer: Action[JsValue] = Action.async(parse.json) { implicit request =>
    request.body.validate[GetTaxpayerRequest].fold(
      invalid =>
        logger.error(s"[ManageCisController][getCisTaxpayer]: Failed to validate payload, errors: $invalid")
        Future.successful(BadRequest(Json.obj("message" -> s"Invalid payload: $invalid"))),
      payload => {
        val fullPath = s"/resources/data/pas/${payload.taxOfficeNumber}/${payload.taxOfficeReference}/taxpayerByEmployerRef.json"

        findResource(fullPath) match {
          case Some(content) => Future.successful(jsonResourceAsResponse(fullPath))
          case _ => Future.successful(NotFound)
        }
      }
    )
  }
}
