import type { WorkflowTask } from '../types/task'
import type { ExecutionEnvironment } from '../types/executor'
import type { TaskType } from '../types/task'

// ── Executor imports ──────────────────────────────────────────────────────────
import { TriggerExecutor } from './TriggerExecutor'
import { ConditionalExecutor } from './ConditionalExecutor'
import { DelayExecutor } from './DelayExecutor'
import { GroupExecutor } from './GroupExecutor'
import { ApiCallExecutor } from './ApiCallExecutor'
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
import { FundAccountExecutor } from './FundAccountExecutor'

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
    FUND_ACCOUNT: FundAccountExecutor,
    SUB_WORKFLOW: SubWorkflowExecutor,
    CUSTOM_BLOCK: CustomBlockExecutor,
}
