# Bug Report Template

## Bug Information
- **Bug ID**: [Auto-generated or manual ID]
- **Date Reported**: [YYYY-MM-DD]
- **Reporter**: [Name and role]
- **Priority**: [Critical | High | Medium | Low]
- **Severity**: [Blocker | Major | Minor | Trivial]
- **Status**: [Open | In Progress | Testing | Resolved | Closed]

## Bug Summary
**Brief Description**: [One line summary of the bug]

## Environment
- **System**: [ComplianceFrameworks | AuditManagement | RiskAssessment | ReportGeneration | Configuration | UI]
- **Version**: [Application version]
- **Environment**: [Development | Testing | Production]
- **Browser/Client**: [If applicable]
- **Operating System**: [If applicable]

## Reproduction Steps
1. [First step]
2. [Second step]
3. [Third step]
4. [Continue until the bug is reproduced]

## Expected Behavior
[Describe what should happen]

## Actual Behavior
[Describe what actually happens]

## Evidence
- **Screenshots**: [Attach relevant screenshots]
- **Error Messages**: [Copy exact error messages]
- **Log Files**: [Attach relevant log excerpts]
- **Video**: [If applicable]

## Configuration Details
- **Configuration Files Involved**: [List affected config files]
- **Relevant Settings**: [List specific configuration values]
- **Feature Flags**: [Any relevant feature flags]

## System Context
- **Affected Framework**: [NIST | ISO27001 | SOC2 | PCI-DSS | Other]
- **Affected Module**: [Specific module or component]
- **User Role**: [Admin | Manager | Auditor | Viewer]
- **Data Volume**: [If relevant - number of records, file sizes, etc.]

## Impact Assessment
- **Business Impact**: [High | Medium | Low]
- **User Impact**: [Number of users affected]
- **Functional Impact**: [What functionality is broken]
- **Data Impact**: [Any data loss or corruption]
- **Security Impact**: [Any security implications]

## Workaround
[If a temporary workaround exists, describe it here]

## Additional Information
[Any other relevant details, context, or observations]

## Related Issues
- **Related Bugs**: [Link to related bug reports]
- **Duplicate Of**: [If this is a duplicate, link to original]
- **Depends On**: [Any dependencies]
- **Blocks**: [Any issues this bug blocks]

## Investigation Notes
[For developer use - investigation findings, root cause analysis]

## Resolution
- **Root Cause**: [What caused the bug]
- **Fix Description**: [How the bug was fixed]
- **Files Modified**: [List of files changed]
- **Configuration Changes**: [Any config changes made]
- **Testing Performed**: [How the fix was tested]

## Verification
- **Verified By**: [Name of person who verified the fix]
- **Verification Date**: [Date of verification]
- **Verification Environment**: [Where the fix was verified]
- **Verification Steps**: [Steps taken to verify the fix]

## Follow-up Actions
- [ ] Update documentation
- [ ] Add regression test
- [ ] Update configuration validation
- [ ] Notify affected users
- [ ] Update system reference docs
- [ ] Review related code areas

---

## Template Usage Instructions

### Priority Levels
- **Critical**: System is completely unusable, security breach, data loss
- **High**: Major functionality broken, affects multiple users
- **Medium**: Minor functionality broken, affects some users
- **Low**: Cosmetic issues, enhancement requests

### Severity Levels
- **Blocker**: Prevents further development or testing
- **Major**: Significant functionality is broken
- **Minor**: Minor functionality is broken
- **Trivial**: Cosmetic or enhancement issues

### Status Workflow
1. **Open**: Bug reported and needs investigation
2. **In Progress**: Bug is being worked on
3. **Testing**: Fix is implemented and being tested
4. **Resolved**: Fix is complete and verified
5. **Closed**: Bug is resolved and no further action needed

### File Naming Convention
- Use format: `YYYY-MM-DD_BugID_ShortDescription.md`
- Example: `2024-07-04_BUG001_ConfigValidationError.md`

### Moving Between Folders
- Place new bugs in `/bugs/open/`
- Move to `/bugs/fixed/` when resolved
- Include resolution information before moving