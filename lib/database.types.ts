
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "clients": {
                  Row: {
                    "ap_email": string | null,"billing_address": string | null,"billing_entity": string | null,"created_at": string,"hubspot_company_id": string | null,"id": string,"name": string,"po_required": boolean,"vat_number": string | null,"xero_contact_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "ap_email"?: string | null,"billing_address"?: string | null,"billing_entity"?: string | null,"created_at"?: string,"hubspot_company_id"?: string | null,"id"?: string,"name": string,"po_required"?: boolean,"vat_number"?: string | null,"xero_contact_id"?: string | null
                  }
                  Update: {
                    "ap_email"?: string | null,"billing_address"?: string | null,"billing_entity"?: string | null,"created_at"?: string,"hubspot_company_id"?: string | null,"id"?: string,"name"?: string,"po_required"?: boolean,"vat_number"?: string | null,"xero_contact_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"contacts": {
                  Row: {
                    "client_id": string,"created_at": string,"email": string,"hubspot_contact_id": string | null,"id": string,"name": string,"phone": string | null,"role": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "client_id": string,"created_at"?: string,"email": string,"hubspot_contact_id"?: string | null,"id"?: string,"name": string,"phone"?: string | null,"role"?: string | null
                  }
                  Update: {
                    "client_id"?: string,"created_at"?: string,"email"?: string,"hubspot_contact_id"?: string | null,"id"?: string,"name"?: string,"phone"?: string | null,"role"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "contacts_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    }
                  ]
                },"invoices": {
                  Row: {
                    "amount_minor": number,"currency": string,"due_at": string | null,"id": string,"issued_at": string | null,"job_id": string,"kind": Database["public"]['Enums']["invoice_kind"],"paid_at": string | null,"status": string,"stripe_checkout_id": string | null,"stripe_payment_intent_id": string | null,"xero_invoice_id": string | null,"xero_invoice_number": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "amount_minor": number,"currency"?: string,"due_at"?: string | null,"id"?: string,"issued_at"?: string | null,"job_id": string,"kind": Database["public"]['Enums']["invoice_kind"],"paid_at"?: string | null,"status"?: string,"stripe_checkout_id"?: string | null,"stripe_payment_intent_id"?: string | null,"xero_invoice_id"?: string | null,"xero_invoice_number"?: string | null
                  }
                  Update: {
                    "amount_minor"?: number,"currency"?: string,"due_at"?: string | null,"id"?: string,"issued_at"?: string | null,"job_id"?: string,"kind"?: Database["public"]['Enums']["invoice_kind"],"paid_at"?: string | null,"status"?: string,"stripe_checkout_id"?: string | null,"stripe_payment_intent_id"?: string | null,"xero_invoice_id"?: string | null,"xero_invoice_number"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "invoices_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "jobs"
      referencedColumns: ["id"]
    }
                  ]
                },"job_assignments": {
                  Row: {
                    "client_confirmed_at": string | null,"client_declined_at": string | null,"expires_at": string | null,"fee_to_scribe_minor": number | null,"id": string,"job_id": string,"offered_at": string,"responded_at": string | null,"response": Database["public"]['Enums']["offer_response"],"scribe_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "client_confirmed_at"?: string | null,"client_declined_at"?: string | null,"expires_at"?: string | null,"fee_to_scribe_minor"?: number | null,"id"?: string,"job_id": string,"offered_at"?: string,"responded_at"?: string | null,"response"?: Database["public"]['Enums']["offer_response"],"scribe_id": string
                  }
                  Update: {
                    "client_confirmed_at"?: string | null,"client_declined_at"?: string | null,"expires_at"?: string | null,"fee_to_scribe_minor"?: number | null,"id"?: string,"job_id"?: string,"offered_at"?: string,"responded_at"?: string | null,"response"?: Database["public"]['Enums']["offer_response"],"scribe_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "job_assignments_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "jobs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "job_assignments_scribe_id_fkey"
      columns: ["scribe_id"]
isOneToOne: false
      referencedRelation: "scribes"
      referencedColumns: ["id"]
    }
                  ]
                },"job_events": {
                  Row: {
                    "actor_id": string | null,"actor_type": Database["public"]['Enums']["party"],"at": string,"from_status": Database["public"]['Enums']["job_status"] | null,"id": number,"job_id": string,"meta": Json | null,"note": string | null,"to_status": Database["public"]['Enums']["job_status"] | null
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id"?: string | null,"actor_type": Database["public"]['Enums']["party"],"at"?: string,"from_status"?: Database["public"]['Enums']["job_status"] | null,"id"?: number,"job_id": string,"meta"?: Json | null,"note"?: string | null,"to_status"?: Database["public"]['Enums']["job_status"] | null
                  }
                  Update: {
                    "actor_id"?: string | null,"actor_type"?: Database["public"]['Enums']["party"],"at"?: string,"from_status"?: Database["public"]['Enums']["job_status"] | null,"id"?: number,"job_id"?: string,"meta"?: Json | null,"note"?: string | null,"to_status"?: Database["public"]['Enums']["job_status"] | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "job_events_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "jobs"
      referencedColumns: ["id"]
    }
                  ]
                },"job_fee_lines": {
                  Row: {
                    "description": string,"id": string,"job_id": string,"qty": number,"sort": number,"unit": string,"unit_rate_minor": number
                  }
                  ComputedFields: never
                  Insert: {
                    "description": string,"id"?: string,"job_id": string,"qty"?: number,"sort"?: number,"unit": string,"unit_rate_minor": number
                  }
                  Update: {
                    "description"?: string,"id"?: string,"job_id"?: string,"qty"?: number,"sort"?: number,"unit"?: string,"unit_rate_minor"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "job_fee_lines_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "jobs"
      referencedColumns: ["id"]
    }
                  ]
                },"job_files": {
                  Row: {
                    "filename": string,"id": string,"job_id": string,"kind": Database["public"]['Enums']["file_kind"],"released_to_client_at": string | null,"size_bytes": number | null,"storage_path": string,"uploaded_at": string,"uploaded_by": Database["public"]['Enums']["party"]
                  }
                  ComputedFields: never
                  Insert: {
                    "filename": string,"id"?: string,"job_id": string,"kind": Database["public"]['Enums']["file_kind"],"released_to_client_at"?: string | null,"size_bytes"?: number | null,"storage_path": string,"uploaded_at"?: string,"uploaded_by": Database["public"]['Enums']["party"]
                  }
                  Update: {
                    "filename"?: string,"id"?: string,"job_id"?: string,"kind"?: Database["public"]['Enums']["file_kind"],"released_to_client_at"?: string | null,"size_bytes"?: number | null,"storage_path"?: string,"uploaded_at"?: string,"uploaded_by"?: Database["public"]['Enums']["party"]
                  }
                  Relationships: [
                    {
      foreignKeyName: "job_files_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "jobs"
      referencedColumns: ["id"]
    }
                  ]
                },"job_sessions": {
                  Row: {
                    "end_time": string | null,"id": string,"job_id": string,"location": string | null,"notes": string | null,"session_date": string,"session_type": string | null,"sort": number,"start_time": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "end_time"?: string | null,"id"?: string,"job_id": string,"location"?: string | null,"notes"?: string | null,"session_date": string,"session_type"?: string | null,"sort"?: number,"start_time"?: string | null
                  }
                  Update: {
                    "end_time"?: string | null,"id"?: string,"job_id"?: string,"location"?: string | null,"notes"?: string | null,"session_date"?: string,"session_type"?: string | null,"sort"?: number,"start_time"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "job_sessions_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "jobs"
      referencedColumns: ["id"]
    }
                  ]
                },"jobs": {
                  Row: {
                    "accepted_at": string | null,"accepted_by": string | null,"accepted_ip": unknown,"cancelled_reason": string | null,"capture": string | null,"client_id": string,"contact_id": string,"contract_status": Database["public"]['Enums']["contract_status"],"created_at": string,"created_by": string | null,"currency": string,"event_name": string,"expenses_policy": string | null,"group_size": string | null,"hubspot_deal_id": string | null,"id": string,"job_ref": string,"logistics": NonNullable<Json>,"output_due": string | null,"output_spec": string | null,"owner_id": string | null,"payment_route": Database["public"]['Enums']["payment_route"] | null,"payment_status": Database["public"]['Enums']["payment_status"],"po_number": string | null,"purpose": string | null,"scribing_type": string | null,"service_type": string,"source": string | null,"status": Database["public"]['Enums']["job_status"],"terms_version": string | null,"updated_at": string,"usage_rights": string | null,"venue": string | null,"venue_tz": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"accepted_ip"?: unknown,"cancelled_reason"?: string | null,"capture"?: string | null,"client_id": string,"contact_id": string,"contract_status"?: Database["public"]['Enums']["contract_status"],"created_at"?: string,"created_by"?: string | null,"currency"?: string,"event_name": string,"expenses_policy"?: string | null,"group_size"?: string | null,"hubspot_deal_id"?: string | null,"id"?: string,"job_ref": string,"logistics"?: NonNullable<Json>,"output_due"?: string | null,"output_spec"?: string | null,"owner_id"?: string | null,"payment_route"?: Database["public"]['Enums']["payment_route"] | null,"payment_status"?: Database["public"]['Enums']["payment_status"],"po_number"?: string | null,"purpose"?: string | null,"scribing_type"?: string | null,"service_type"?: string,"source"?: string | null,"status"?: Database["public"]['Enums']["job_status"],"terms_version"?: string | null,"updated_at"?: string,"usage_rights"?: string | null,"venue"?: string | null,"venue_tz"?: string
                  }
                  Update: {
                    "accepted_at"?: string | null,"accepted_by"?: string | null,"accepted_ip"?: unknown,"cancelled_reason"?: string | null,"capture"?: string | null,"client_id"?: string,"contact_id"?: string,"contract_status"?: Database["public"]['Enums']["contract_status"],"created_at"?: string,"created_by"?: string | null,"currency"?: string,"event_name"?: string,"expenses_policy"?: string | null,"group_size"?: string | null,"hubspot_deal_id"?: string | null,"id"?: string,"job_ref"?: string,"logistics"?: NonNullable<Json>,"output_due"?: string | null,"output_spec"?: string | null,"owner_id"?: string | null,"payment_route"?: Database["public"]['Enums']["payment_route"] | null,"payment_status"?: Database["public"]['Enums']["payment_status"],"po_number"?: string | null,"purpose"?: string | null,"scribing_type"?: string | null,"service_type"?: string,"source"?: string | null,"status"?: Database["public"]['Enums']["job_status"],"terms_version"?: string | null,"updated_at"?: string,"usage_rights"?: string | null,"venue"?: string | null,"venue_tz"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "jobs_client_id_fkey"
      columns: ["client_id"]
isOneToOne: false
      referencedRelation: "clients"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "jobs_contact_id_fkey"
      columns: ["contact_id"]
isOneToOne: false
      referencedRelation: "contacts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "jobs_service_type_fkey"
      columns: ["service_type"]
isOneToOne: false
      referencedRelation: "service_types"
      referencedColumns: ["id"]
    }
                  ]
                },"scribes": {
                  Row: {
                    "active": boolean,"base_location": string | null,"created_at": string,"currency": string,"day_rate_minor": number | null,"email": string,"half_day_rate_minor": number | null,"id": string,"languages": (string)[],"name": string,"notes": string | null,"phone": string | null,"portfolio_urls": (string)[],"styles": (string)[]
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"base_location"?: string | null,"created_at"?: string,"currency"?: string,"day_rate_minor"?: number | null,"email": string,"half_day_rate_minor"?: number | null,"id"?: string,"languages"?: (string)[],"name": string,"notes"?: string | null,"phone"?: string | null,"portfolio_urls"?: (string)[],"styles"?: (string)[]
                  }
                  Update: {
                    "active"?: boolean,"base_location"?: string | null,"created_at"?: string,"currency"?: string,"day_rate_minor"?: number | null,"email"?: string,"half_day_rate_minor"?: number | null,"id"?: string,"languages"?: (string)[],"name"?: string,"notes"?: string | null,"phone"?: string | null,"portfolio_urls"?: (string)[],"styles"?: (string)[]
                  }
                  Relationships: [
                    
                  ]
                },"service_types": {
                  Row: {
                    "active": boolean,"form_template": NonNullable<Json>,"id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"form_template"?: NonNullable<Json>,"id": string,"name": string
                  }
                  Update: {
                    "active"?: boolean,"form_template"?: NonNullable<Json>,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"settings": {
                  Row: {
                    "key": string,"value": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "key": string,"value": NonNullable<Json>
                  }
                  Update: {
                    "key"?: string,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    
                  ]
                },"team_members": {
                  Row: {
                    "created_at": string,"email": string,"full_name": string | null,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"email": string,"full_name"?: string | null,"id": string
                  }
                  Update: {
                    "created_at"?: string,"email"?: string,"full_name"?: string | null,"id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"tokens": {
                  Row: {
                    "created_at": string,"expires_at": string,"id": string,"job_id": string,"last_used_at": string | null,"party": Database["public"]['Enums']["party"],"revoked_at": string | null,"scribe_id": string | null,"token_hash": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"expires_at": string,"id"?: string,"job_id": string,"last_used_at"?: string | null,"party": Database["public"]['Enums']["party"],"revoked_at"?: string | null,"scribe_id"?: string | null,"token_hash": string
                  }
                  Update: {
                    "created_at"?: string,"expires_at"?: string,"id"?: string,"job_id"?: string,"last_used_at"?: string | null,"party"?: Database["public"]['Enums']["party"],"revoked_at"?: string | null,"scribe_id"?: string | null,"token_hash"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "tokens_job_id_fkey"
      columns: ["job_id"]
isOneToOne: false
      referencedRelation: "jobs"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "tokens_scribe_id_fkey"
      columns: ["scribe_id"]
isOneToOne: false
      referencedRelation: "scribes"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "create_job":
{ Args: { "payload": Json }; Returns: {
              "accepted_at": string | null,
"accepted_by": string | null,
"accepted_ip": unknown,
"cancelled_reason": string | null,
"capture": string | null,
"client_id": string,
"contact_id": string,
"contract_status": Database["public"]['Enums']["contract_status"],
"created_at": string,
"created_by": string | null,
"currency": string,
"event_name": string,
"expenses_policy": string | null,
"group_size": string | null,
"hubspot_deal_id": string | null,
"id": string,
"job_ref": string,
"logistics": NonNullable<Json>,
"output_due": string | null,
"output_spec": string | null,
"owner_id": string | null,
"payment_route": Database["public"]['Enums']["payment_route"] | null,
"payment_status": Database["public"]['Enums']["payment_status"],
"po_number": string | null,
"purpose": string | null,
"scribing_type": string | null,
"service_type": string,
"source": string | null,
"status": Database["public"]['Enums']["job_status"],
"terms_version": string | null,
"updated_at": string,
"usage_rights": string | null,
"venue": string | null,
"venue_tz": string
            }
                          SetofOptions: {
        from: "*"
        to: "jobs"
        isOneToOne: true
        isSetofReturn: false
      } },
"is_team":
{ Args: Record<PropertyKey, never>; Returns: boolean
                           },
"next_job_ref":
{ Args: Record<PropertyKey, never>; Returns: string
                           },
"send_booking_link":
{ Args: { "p_job_id": string,"p_token_hash": string }; Returns: {
              "created_at": string,
"expires_at": string,
"id": string,
"job_id": string,
"last_used_at": string | null,
"party": Database["public"]['Enums']["party"],
"revoked_at": string | null,
"scribe_id": string | null,
"token_hash": string
            }
                          SetofOptions: {
        from: "*"
        to: "tokens"
        isOneToOne: true
        isSetofReturn: false
      } }
          }
          Enums: {
            "contract_status": "pending"|"accepted_online"|"signed_docusign","file_kind": "brief"|"output"|"po"|"invoice"|"receipt"|"sow","invoice_kind": "deposit"|"balance"|"full"|"expenses","job_status": "draft"|"awaiting_client"|"booked"|"sourcing"|"scribe_assigned"|"confirmed"|"delivered"|"closed"|"cancelled","offer_response": "pending"|"accepted"|"declined"|"expired"|"withdrawn","party": "team"|"client"|"scribe"|"system","payment_route": "po"|"card","payment_status": "unpaid"|"deposit_paid"|"po_received"|"paid"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "contract_status": ["pending", "accepted_online", "signed_docusign"],"file_kind": ["brief", "output", "po", "invoice", "receipt", "sow"],"invoice_kind": ["deposit", "balance", "full", "expenses"],"job_status": ["draft", "awaiting_client", "booked", "sourcing", "scribe_assigned", "confirmed", "delivered", "closed", "cancelled"],"offer_response": ["pending", "accepted", "declined", "expired", "withdrawn"],"party": ["team", "client", "scribe", "system"],"payment_route": ["po", "card"],"payment_status": ["unpaid", "deposit_paid", "po_received", "paid"]
          }
        }
} as const
