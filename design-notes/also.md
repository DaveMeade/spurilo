    - **Framework Mapping Visualization**
      - Spurilo provides interactive maps showing how controls from one framework overlap or diverge from others in the profile.  
      - Filters allow auditors and client stakeholders to view requirements by framework, by category (e.g., Access Control, Vendor Risk), or by applicability.  

    
    ((( Tracker: )))
    - **Control Matrix Generation**
      - A structured control matrix is created showing each requirement, its framework origin, mapped equivalents, testing objectives, and assignment of control custodians.  
      - Matrices can be exported or shared live through Spurilo’s web interface. 


    (((( Compliance Reports: ))))
    - **Statement of Applicability (SoA)**
      - Spurilo supports generation of an SoA (particularly for ISO 27001) by marking controls as **Applicable**, **Not Applicable**, or **Excluded**, along with justification.  
      - Justifications and scoping notes are stored as engagement artifacts for downstream use in testing and reporting.  


    ~~~ Control Profile -> dataset for tracker view
      ~~~~ Control Profile - upstream master. Git. Import auditor owned profile (json) to client owned Spurilo. profiles with upstream masters are branched when imported. main branch is protected. would allow for org hosted spurilo tracker, with remote auditor using their system but auditor publishing the control profile from own spurilo. client/auditors spurilo could update via git. (AI tasks limited to auditor side)
          -- put thought into this. perhaps there is separate app clients can install to host the audit and store the evidence, that works with Spurilo for engagement management / and control evaluation

          