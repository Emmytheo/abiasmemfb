import type { WorkflowTask } from '../types/task'
import type { ExecutionEnvironment } from '../types/executor'
import type { TaskType } from '../types/task'

// ── Executor imports ──────────────────────────────────────────────────────────
import { TriggerExecutor } from './TriggerExecutor'
import { ConditionalExecutor } from './ConditionalExecutor'
import { DelayExecutor } from './DelayExecutor'
import { GroupExecutor } from './GroupExecutor'
import { ApiCallExecutor } from './ApiCallExecutor'
import { ApiExecutionExecutor } from './ApiExecutionExecutor'
import { ApiSwitchExecutor } from './ApiSwitchExecutor'
import { ApprovalGateExecutor } from './ApprovalGateExecutor'
import { SendEmailExecutor } from './SendEmailExecutor'
import { SendSmsExecutor } from './SendSmsExecutor'
import { SubWorkflowExecutor } from './SubWorkflowExecutor'
import { CustomBlockExecutor } from './CustomBlockExecutor'
import { TransformDataExecutor } from './TransformDataExecutor'
import { CreateAccountExecutor } from './CreateAccountExecutor'
import { DisburseLoanExecutor } from './DisburseLoanExecutor'
import { IntraAccountTransferExecutor } from './IntraAccountTransferExecutor'
import { InterBankTransferExecutor } from './InterBankTransferExecutor'
import { InternationalTransferExecutor } from './InternationalTransferExecutor'
import { FundAccountExecutor } from './FundAccountExecutor'
import { RegistrySyncExecutor } from './RegistrySyncExecutor'

import {
    LoopExecutor,
    ValidateDataExecutor,
    MapFieldsExecutor,
    AutoApproveExecutor,
    AutoRejectExecutor,
    WebhookDeliverExecutor,
    GenerateDocumentExecutor,
    KycCheckExecutor,
    CreditScoreExecutor,
} from './misc-executors'

import {
    QoreRequestCardExecutor,
    QoreFreezeCardExecutor,
    QoreUpdateCardLimitsExecutor,
    QoreFreezeAccountExecutor,
    QoreManageLienExecutor,
    QoreValidateBillExecutor,
    QorePayBillExecutor,
    QoreCreateFixedDepositExecutor,
    QoreLiquidateFixedDepositExecutor,
    QoreUnfreezeAccountExecutor,
    QoreCheckFreezeStatusExecutor,
    QoreCheckLienStatusExecutor,
    QoreActivatePNDExecutor,
    QoreDeactivatePNDExecutor,
    QoreGetAccountTransactionsExecutor,
    QoreGenerateStatementExecutor,
    QoreUpgradeAccountTierExecutor,
    QoreUploadDocumentExecutor,
    QoreCloseAccountExecutor,
    QoreRetrieveBVNExecutor,
    // missing account/customer/tx executors
    QoreCreateAccountQuickExecutor,
    QoreCreateCustomerAndAccountExecutor,
    QoreAccountEnquiryExecutor,
    QoreAccountSummaryExecutor,
    QoreGetAccountsByCustomerExecutor,
    QoreCheckPNDStatusExecutor,
    QoreUpdateNotificationPreferenceExecutor,
    QoreGetAccountByTrackingRefExecutor,
    QoreCreateCustomerExecutor,
    QoreGetCustomerByBVNExecutor,
    QoreTransactionStatusQueryExecutor,
    QoreIntraBankTransferExecutor,
    QoreInterBankTransferExecutor,
} from './QoreExecutors'

type ExecutorFn<T extends WorkflowTask> = (
    env: ExecutionEnvironment<T>
) => Promise<boolean>

type RegistryType = {
    [K in TaskType]: ExecutorFn<WorkflowTask & { type: K }>
}

export const ExecutorRegistry: RegistryType = {
    TRIGGER: TriggerExecutor,
    CONDITIONAL: ConditionalExecutor,
    LOOP: LoopExecutor,
    DELAY: DelayExecutor,
    GROUP: GroupExecutor,
    API_CALL: ApiCallExecutor,
    API_EXECUTION: ApiExecutionExecutor,
    API_SWITCH: ApiSwitchExecutor,
    WEBHOOK_DELIVER: WebhookDeliverExecutor,
    APPROVAL_GATE: ApprovalGateExecutor,
    AUTO_APPROVE: AutoApproveExecutor,
    AUTO_REJECT: AutoRejectExecutor,
    SEND_EMAIL: SendEmailExecutor,
    SEND_SMS: SendSmsExecutor,
    TRANSFORM_DATA: TransformDataExecutor,
    VALIDATE_DATA: ValidateDataExecutor,
    MAP_FIELDS: MapFieldsExecutor,
    GENERATE_DOCUMENT: GenerateDocumentExecutor,
    KYC_CHECK: KycCheckExecutor,
    CREDIT_SCORE_CHECK: CreditScoreExecutor,
    CREATE_ACCOUNT: CreateAccountExecutor,
    DISBURSE_LOAN: DisburseLoanExecutor,
    INTRA_ACCOUNT_TRANSFER: IntraAccountTransferExecutor,
    INTERBANK_TRANSFER: InterBankTransferExecutor,
    INTERNATIONAL_TRANSFER: InternationalTransferExecutor,
    FUND_ACCOUNT: FundAccountExecutor,
    SUB_WORKFLOW: SubWorkflowExecutor,
    CUSTOM_BLOCK: CustomBlockExecutor,
    QORE_REQUEST_CARD: QoreRequestCardExecutor,
    QORE_FREEZE_CARD: QoreFreezeCardExecutor,
    QORE_UPDATE_CARD_LIMITS: QoreUpdateCardLimitsExecutor,
    QORE_FREEZE_ACCOUNT: QoreFreezeAccountExecutor,
    QORE_MANAGE_LIEN: QoreManageLienExecutor,
    QORE_VALIDATE_BILL: QoreValidateBillExecutor,
    QORE_PAY_BILL: QorePayBillExecutor,
    QORE_CREATE_FIXED_DEPOSIT: QoreCreateFixedDepositExecutor,
    QORE_LIQUIDATE_FIXED_DEPOSIT: QoreLiquidateFixedDepositExecutor,
    // Extended Qore Nodes
    QORE_UNFREEZE_ACCOUNT: QoreUnfreezeAccountExecutor,
    QORE_CHECK_FREEZE_STATUS: QoreCheckFreezeStatusExecutor,
    QORE_CHECK_LIEN_STATUS: QoreCheckLienStatusExecutor,
    QORE_ACTIVATE_PND: QoreActivatePNDExecutor,
    QORE_DEACTIVATE_PND: QoreDeactivatePNDExecutor,
    QORE_GET_ACCOUNT_TRANSACTIONS: QoreGetAccountTransactionsExecutor,
    QORE_GENERATE_STATEMENT: QoreGenerateStatementExecutor,
    QORE_UPGRADE_ACCOUNT_TIER: QoreUpgradeAccountTierExecutor,
    QORE_UPLOAD_DOCUMENT: QoreUploadDocumentExecutor,
    QORE_CLOSE_ACCOUNT: QoreCloseAccountExecutor,
    QORE_RETRIEVE_BVN: QoreRetrieveBVNExecutor,

    // missing account/customer/tx executors
    QORE_CREATE_ACCOUNT_QUICK: QoreCreateAccountQuickExecutor,
    QORE_CREATE_CUSTOMER_AND_ACCOUNT: QoreCreateCustomerAndAccountExecutor,
    QORE_ACCOUNT_ENQUIRY: QoreAccountEnquiryExecutor,
    QORE_ACCOUNT_SUMMARY: QoreAccountSummaryExecutor,
    QORE_GET_ACCOUNTS_BY_CUSTOMER: QoreGetAccountsByCustomerExecutor,
    QORE_CHECK_PND_STATUS: QoreCheckPNDStatusExecutor,
    QORE_UPDATE_NOTIFICATION_PREFERENCE: QoreUpdateNotificationPreferenceExecutor,
    QORE_GET_ACCOUNT_BY_TRACKING_REF: QoreGetAccountByTrackingRefExecutor,
    QORE_CREATE_CUSTOMER: QoreCreateCustomerExecutor,
    QORE_GET_CUSTOMER_BY_BVN: QoreGetCustomerByBVNExecutor,
    QORE_TRANSACTION_STATUS_QUERY: QoreTransactionStatusQueryExecutor,
    QORE_INTRA_BANK_TRANSFER: QoreIntraBankTransferExecutor,
    QORE_INTER_BANK_TRANSFER: QoreInterBankTransferExecutor,
    REGISTRY_SYNC: RegistrySyncExecutor,
}
