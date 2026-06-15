// admin.dto.ts
export class UpdateExamDto {
  title?: string;
  description?: string;
  isActive?: boolean;
}

export class UpdateVocabDto {
  word?: string;
  meaning?: string;
  ipa?: string;
  exampleEn?: string;
  exampleVi?: string;
}