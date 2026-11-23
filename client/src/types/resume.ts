export interface Resume {
  id: string;
  title: string;
  /** "<user id>/<file id>.pdf" inside the private "resumes" storage bucket */
  filePath: string;
  fileName: string;
  fileSize: number;
  extractedText: string | null;
  isDefault: boolean;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
}
