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
import play.api.libs.json.Json
import play.api.mvc.{Action, AnyContent, ControllerComponents}
import uk.gov.hmrc.play.bootstrap.backend.controller.BackendController

import javax.inject.Inject

/**
 * Stub for the RDS client list calls used by the agent service guards.
 *
 * Client list status is chosen by the credentialId, so testers can sign in with
 * a particular credential to get a particular result:
 *   clientlist-failed     -> Failed
 *   clientlist-inprogress -> InProgress
 *   anything else         -> Succeeded
 *
 * Has client is chosen by the tax office reference:
 *   NOCLIENT              -> hasClient = false
 *   anything else         -> hasClient = true
 */
@Singleton
class ClientListController @Inject()(cc: ControllerComponents)
  extends BackendController(cc) {

  def getClientListDownloadStatus(credentialId: String, serviceName: String, gracePeriod: Int): Action[AnyContent] =
    Action {
      val status = credentialId match {
        case "clientlist-failed"     => "Failed"
        case "clientlist-inprogress" => "InProgress"
        case _                       => "Succeeded"
      }
      Ok(Json.obj("status" -> status))
    }

  def hasClient(irAgentId: String,
                credentialId: String,
                taxOfficeNumber: String,
                taxOfficeReference: String,
                serviceName: String): Action[AnyContent] =
    Action {
      Ok(Json.obj("hasClient" -> (taxOfficeReference != "NOCLIENT")))
    }
}
