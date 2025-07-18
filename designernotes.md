Note to AI Agent: You should ignore this file; it is not meant to provide guidnance in any way.

----

Lets make some UI improvements.
1) move the version number in the header to the left of the search bar, and make its text smaller and lighter.
2) Create an admin menu as a collapsable left-hand sidebar. the menu should only be available to admins, and when open shows a sidebar with admin functions like:
manage organziations
manage enagement calendar
manage system permissions
When the admin user collapses (default) or shows the admin sidebar, their preference for showing it should be saved to their user preferences and respected when the page loads or refreshes.

----
Organization JSON Schema:

{
  "organizations": [{
    "id": "acme001",
    "crm_link": "https://slackspace.capsulecrm.com/party/272828446",
    "name": "Automatic Express",
    "aka_names": {
        "formal_name": "Automatic Expres, LLC"
        "friendly_name": "Automatic"
        "short_name": "ACME"
        "dba": "",
        "_comment": "name variants used in deliverables."
    },
    "status": "pending|active|paused|disabled|archived",
    "org_domains": ["clientdomain.com", "client-alt-email-domain.com"]
  }]
}

engagements: [{
    "id": "orgID_engagement_type_yymm:v"
    "org": "orgID"
    "type": "engagement_type"
    "name": "Organization Internal Audit - YYYY.MM"   
    "frameworks": [{
        "framework": "SOC2"
        "components": ["security", "availability", "processing integrity", "confidentiality", "privacy" ]
    },
    {
        "framework": "ISO27001"
    }]
    "status": "pending|scheduled|active|extended|closed"
    "stage": "onboarding|fieldwork|deliverable creation|deliverable review|wrap-up"
    "timeline": {
        "start_date": "date/timestamp",
        "onboard_survey_due": "date/timestamp",
        "irl_delivery": "date/timestamp",
        "kickoff_call": "",
        "fieldwork_start": "date/timestamp",
        "fieldwork_end": "date/timestamp",
        "evidence_cutoff": "date/timestamp",
        "closing_call": "",
        "draft_report_delivery": "date/timestamp",
        "end_date": "date/timestamp",
        "deliverables_due": "date/timestamp"
    }
    "engagement_owner": "emailaddress",
    "participants": [{
        "user_id": "user@org.com",
        "roles": ["Engagement Owner", "Control Owner", "SME"]
    }]
    "notes": "",
    "portal_url": "/engagements/${this.id}",
    "created": "date/timestamp",
    "modified": "date/timestamp"
}]

engagement_control_profile [{
    "engagement_id": "orgID_engagement_type_yymm:v"
    "requirement_id": "SOC_TSC_2022_CC1.1:1",
    "included": true,
    "justification": "...",
    "control_owner": "participant_emailaddress",
    "status": "open|responded|under_review|action_required|complete"
    "owner_response": "see policy X page 14, and published privacy policy"
    "evidence": [{
        "id": "guid"
        "type": "file"
        "subtype": "document | image"
        "name": "filename.ext"
        "desc": "policy x"
        "provided_by": "participant_email"
    },
    {
        "id": "guid"
        "type": "link"
        "desc": "privacy policy"
        "provided_by": "participant_email"
    }],
    "prior_submissions": [{
        "engagement_id": "last years audit engagement id"
    }],
    "control_notes": [{
        "id": "guid",
        "private": true,
        "note": "This control is provided by a service provider: AWS",
        "author": "participant_email"
    }]
}]

messages [{
    id: guid
    engagement_id: enagement_id,
    control_id: requirement_id,
    _comment: "if control_id is empty/null, the comment is made at the engagement level",
    "from": "participant_email",
    "to: "",
    _comment: "if to: is empty/null it is viewable by all participants with access to the engagement or control as applicable",
    "message": "hello @username, I have a follow-up on this control. please ...",
    "mentions": ["@username"],
    "status": "draft | sent | read",
    "meta": [{
        "sent": "date/timestamp",
        "read": [{
            "by": "participant_email",
            "on": "date/timestamp"
        }]
    }]
}]