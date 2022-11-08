// @ts-nocheck
sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Core",
    "sap/m/MessagePopover",
    "sap/ui/core/Element",
    "sap/m/MessageItem",
    "sap/ui/core/library",
    "sap/ui/core/message/Message",
  ],
  /**
   * @param {typeof sap.ui.core.mvc.Controller} Controller
   * @param {typeof sap.ui.model.json.JSONModel } JSONModel
   * @param {typeof sap.m.MessagePopover} MessagePopover
   * @param {typeof sap.ui.core.Element } Element
   * @param {typeof sap.m.MessageItem } MessageItem
   * @param {typeof sap.ui.core.library } library
   * @param {typeof sap.ui.core.message.Message } Message
   */
  function (
    Controller,
    JSONModel,
    Core,
    MessagePopover,
    Element,
    MessageItem,
    library,
    Message
  ) {
    var MessageType = library.MessageType;

    return Controller.extend("test.validaciones.controller.View1", {
      onInit: function () {
        const oModel = new JSONModel();
        oModel.loadData("./localService/mockdata/CustomerModel.json");

        this.oView = this.getView();
        this._MessageManager = Core.getMessageManager();
        //Clear the old messages
        this._MessageManager.removeAllMessages();
        this.oView.setModel(oModel);
        this._MessageManager.registerObject( this.oView.byId("formContainerPersonal"), true );
        this.oView.setModel(this._MessageManager.getMessageModel(), "message");
        this.createMessagePopover();
      },

      createMessagePopover: function () {
        let that = this;
        this.oMP = new MessagePopover({
          activeTitlePress: function (oEvent) {
            let oItem = oEvent.getParameter("item");
            let oPage = that.getView().byId("employeePage");
            let oMessage = oItem.getBindingContext("message").getObject();
            let oControl = Element.registry.get(oMessage.getControlId());
            if (oControl) {
              oPage.scrollToElement(oControl.getDomRef(), 200, [0, -100]);
              setTimeout(function () {
                oControl.focus();
              }, 300);
            }
          },
          items: {
            path: "message>/",
            template: new MessageItem({
              title: "{message>message}",
              subtitle: "{message>additionalText}",
              groupName: {
                parts: [
                  {
                    path: "message>controlIds",
                  },
                ],
                formatter: this.getGroupName,
              },
              activeTitle: {
                parts: [
                  {
                    path: "message>controlIds",
                  },
                ],
                formatter: this.isPositionable,
              },
              type: "{message>type}",
              description: "{message>message}",
            }),
          },
          groupItems: true,
        });
        this.getView().byId("messagePopover").addDependent(this.oMP);
      },

      // the group name is generated based on the current layout
      // specific for each use case
      getGroupName: function (sControlId) {
        if (typeof sControlId === "string") {
          let oControl = Element.registry.get(sControlId);

          if (oControl) {
            let sFormSubtitle = oControl
              .getParent()
              .getParent()
              .getTitle()
              .getText();
            let sFormTitle = oControl
              .getParent()
              .getParent()
              .getParent()
              .getTitle();
            return sFormTitle + ", " + sFormSubtitle;
          }
        }
      },

      // this hook can be used by the application to determine if a
      // control can be found/reached on the page and navigate to
      isPositionable: function (sControlId) {
        return sControlId ? true : false;
      },

      // Set the button icon according to the message with the highest severity
      //The priority of the message types are as follows: Error >    Warning > Success > Info
      mpIconFormatter: function () {
        let sIcon;
        let aMessage = this._MessageManager.getMessageModel().oData;
        aMessage.forEach(function (sMessage) {
          switch (sMessage.type) {
            case "Error":
              sIcon = "sap-icon://message-error";
              break;
            case "Warning":
              sIcon =
                sIcon !== "sap-icon://message-error"
                  ? "sap-icon://message-warning"
                  : sIcon;
              break;
            case "Success":
              sIcon =
                sIcon !== "sap-icon://message-error" &&
                sIcon !== "sap-icon://message-warning"
                  ? "sap-icon://message-success"
                  : sIcon;
              break;
            default:
              sIcon = !sIcon ? "sap-icon://message-information" : sIcon;
              break;
          }
        });
        return sIcon;
      },

      //Display the button type according to the message with the highest severity
      //The priority of the message types are as follows: Error >    Warning > Success > Info
      mpTypeFormatter: function () {
        let sHighestSeverity;
        let aMessage = this._MessageManager.getMessageModel().oData;
        aMessage.forEach(function (sMessage) {
          switch (sMessage.type) {
            case "Error":
              sHighestSeverity = "Negative";
              break;
            case "Warning":
              sHighestSeverity =
                sHighestSeverity !== "Negative" ? "Critical" : sHighestSeverity;
              break;
            case "Success":
              sHighestSeverity =
                sHighestSeverity !== "Negative" &&
                sHighestSeverity !== "Critical"
                  ? "Success"
                  : sHighestSeverity;
              break;
            default:
              sHighestSeverity = !sHighestSeverity
                ? "Neutral"
                : sHighestSeverity;
              break;
          }
        });
        return sHighestSeverity;
      },

      mpSeverityMessages: function () {
        let sHighestSeverityIconType = this.mpTypeFormatter();
        let sHighestSeverityMessageType;
        switch (sHighestSeverityIconType) {
          case "Negative":
            sHighestSeverityMessageType = "Error";
            break;
          case "Critical":
            sHighestSeverityMessageType = "Warning";
            break;
          case "Negative":
            sHighestSeverityMessageType = "Success";
            break;
          default:
            sHighestSeverityMessageType = !sHighestSeverityMessageType
              ? "Information"
              : sHighestSeverityMessageType;
            break;
        }
        return;
        this._MessageManager
          .getMessageModel()
          .oData.reduce(function (iNumberofMessages, oMessageItem) {
            return oMessageItem.type === sHighestSeverityMessageType
              ? ++iNumberofMessages
              : iNumberofMessages;
          }, 0) || "";
      },

      handleMessagesPopover: function (oEvent) {
        if (!this.oMP) {
          this.oMP.createMessagePopover();
        }
        this.oMP.toggle(oEvent.getSource());
      },

      removeMessageFromTarget: function (sTarget) {
        this._MessageManager
          .getMessageModel()
          .getData()
          .forEach(
            function (oMessage) {
              if (oMessage.target === sTarget) {
                this._MessageManager.removeMessages(oMessage);
              }
            }.bind(this)
          );
      },

      handleRequiredField: function (oInput) {
        let sTarget = oInput.getBindingContext().getPath() + "/" + oInput.getBindingPath("value");
        //logic to remove message from traget
        this.removeMessageFromTarget(sTarget);
        if (!oInput.getValue()) {
          this._MessageManager.addMessages(
            new Message({
              message: " Campo requerido",
              type: MessageType.Error,
              additionalText: oInput.getLabels()[0].getText(),
              target: sTarget,
              processor: this.getView().getModel(),
            })
          );
        }
      },

      checkInputConstraints: function (oInput) {
        var oBinding = oInput.getBinding("value"),
          sValueState = "None",
          message,
          type,
          description,
          sTarget = oInput.getBindingContext().getPath() + "/" + oInput.getBindingPath("value");

        this.removeMessageFromTarget(sTarget);

        switch (oInput.getName()) {
          case "nameIpt":
            message = "Ingrese un Nombre Válido";
            type = MessageType.Error;
            description = "Debe cargar al menos 2 Caracteres";
            sValueState = "Error";
            break;
            case "horasIpt":
              message = "Valores permitidos entre 1 y 40";
              type = MessageType.Error;
              description = "Valores permitidos entre 1 y 40";
              sValueState = "Error";
              break;  
          case "mail":
            message = "Ingrese un email correcto";
            type = MessageType.Error;
            description =
              "Debe ingresar un correo electronico válido";
            sValueState = "Error";
            break;
          default:
            break;
        }
        try {
          oBinding.getType().validateValue(oInput.getValue());
        } catch (oException) {
          this._MessageManager.addMessages(
            new Message({
              message: message,
              type: type,
              additionalText: oInput.getLabels()[0].getText(),
              description: description,
              target: sTarget,
              processor: this.getView().getModel(),
            })
          );
          oInput.setValueState(sValueState);
        }
      },

      onChange: function (oEvent) {
        var oInput = oEvent.getSource();
        if (oInput.getRequired()) {
          this.handleRequiredField(oInput);
        } else {
          this.checkInputConstraints(oInput);
        }
        //if (oInput.getLabels()[0].getText() === "Standard Weekly Hours") {
        // }
      },

      saveData: function () {
        const oView = this.getView();
        let oButton = oView.byId("messagePopover");

        let oNameInput    = oView.byId("formContainerPersonal").getItems()[0].getContent()[2];
        let oEmailInput   = oView.byId("formContainerPersonal").getItems()[0].getContent()[12];
        let iWeeklyHours  = oView.byId("formContainerEmployment").getItems()[0].getContent()[13];

        oButton.setVisible(true);
        
        this.handleRequiredField(oNameInput);
        // this.checkInputConstraints(oNameInput);
        this.checkInputConstraints(oEmailInput);
        this.checkInputConstraints(iWeeklyHours);
        this.oMP.getBinding("items").attachChange(
          function (oEvent) {
            this.oMP.navigateBack();
            oButton.setType(this.mpTypeFormatter());
            oButton.setIcon(this.mpIconFormatter());
            oButton.setText(this.mpSeverityMessages());
          }.bind(this)
        );
        
        setTimeout( function () { this.oMP.openBy(oButton) }.bind(this), 100 );
      },
    });
  }
);
