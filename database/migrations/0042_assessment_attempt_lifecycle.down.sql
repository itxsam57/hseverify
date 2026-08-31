-- Roll back only M2.07 Candidate Assessment Window persistence objects.

DROP TABLE IF EXISTS assessment_attempt_answers;
DROP TABLE IF EXISTS assessment_attempts;

ALTER TABLE assessment_question_versions
  DROP CONSTRAINT IF EXISTS assessment_question_versions_answer_type_uq;
ALTER TABLE generated_assessment_form_items
  DROP CONSTRAINT IF EXISTS generated_assessment_form_items_answer_lineage_uq;
ALTER TABLE generated_assessment_form_items
  DROP CONSTRAINT IF EXISTS generated_assessment_form_items_form_item_uq;
ALTER TABLE generated_assessment_forms
  DROP CONSTRAINT IF EXISTS generated_assessment_forms_attempt_lineage_uq;
ALTER TABLE assessment_catalogue_versions
  DROP CONSTRAINT IF EXISTS assessment_catalogue_versions_attempt_lineage_uq;
