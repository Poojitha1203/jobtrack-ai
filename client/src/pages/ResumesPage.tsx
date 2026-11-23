import { useState, type FormEvent } from 'react';
import { FileText } from 'lucide-react';
import { PageHeader } from '../components/layout/PageHeader.tsx';
import { Card, CardHeader } from '../components/ui/Card.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { Button } from '../components/ui/Button.tsx';
import { EmptyState } from '../components/ui/EmptyState.tsx';
import { Skeleton } from '../components/ui/Skeleton.tsx';
import { Modal, ModalFooter } from '../components/ui/Modal.tsx';
import { TextField } from '../components/ui/TextField.tsx';
import { ConfirmDialog } from '../components/ui/ConfirmDialog.tsx';
import { ResumeUploader } from '../components/resumes/ResumeUploader.tsx';
import { ResumeCard } from '../components/resumes/ResumeCard.tsx';
import { useAsyncData } from '../hooks/useAsyncData.ts';
import { useDocumentTitle } from '../hooks/useDocumentTitle.ts';
import { useToast } from '../hooks/useToast.ts';
import { deleteResume, getResumeViewUrl, listResumes, updateResume } from '../services/resumes.ts';
import { countWords } from '../lib/pdfText.ts';
import type { Resume } from '../types/resume.ts';

function RenameForm({ resume, onDone }: { resume: Resume; onDone: (updated?: Resume) => void }) {
  const [title, setTitle] = useState(resume.title);
  const [error, setError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) return setError('Title is required');
    setSaving(true);
    try {
      onDone(await updateResume(resume.id, { title: title.trim() }));
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : 'Could not rename');
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <div className="px-6 py-5">
        <TextField label="Title" value={title} maxLength={150} autoFocus error={error} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <ModalFooter>
        <Button variant="secondary" onClick={() => onDone()} disabled={saving}>Cancel</Button>
        <Button type="submit" loading={saving}>Save</Button>
      </ModalFooter>
    </form>
  );
}

export function ResumesPage() {
  useDocumentTitle('Resumes');
  const showToast = useToast();
  const { data, error, reload } = useAsyncData(listResumes, 'resumes');
  const [textOf, setTextOf] = useState<Resume | null>(null);
  const [renaming, setRenaming] = useState<Resume | null>(null);
  const [toDelete, setToDelete] = useState<Resume | null>(null);
  const [deleting, setDeleting] = useState(false);

  const view = async (resume: Resume) => {
    // Open the tab synchronously (avoids popup blockers), then point it at the signed URL.
    const tab = window.open('', '_blank');
    try {
      const url = await getResumeViewUrl(resume.filePath);
      if (tab) tab.location.href = url;
      else window.location.href = url;
    } catch (err) {
      tab?.close();
      showToast(err instanceof Error ? err.message : 'Could not open the file', 'error');
    }
  };

  const makeDefault = async (resume: Resume) => {
    try {
      await updateResume(resume.id, { isDefault: true });
      showToast(`“${resume.title}” is now your default resume`);
      reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not update', 'error');
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await deleteResume(toDelete.id);
      showToast('Resume deleted');
      setToDelete(null);
      reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not delete', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Resumes"
        description="Keep every version of your resume, see which one you sent where, and use them for job matching."
      />

      <Card>
        <CardHeader title="Upload a resume" description="Your file is stored privately — only you can open it." />
        <div className="p-5">
          <ResumeUploader
            onUploaded={(resume) => {
              showToast(`Uploaded “${resume.title}”`);
              reload();
            }}
          />
        </div>
      </Card>

      {error && (
        <Alert tone="error" title="Couldn't load resumes">
          {error.message}{' '}
          <button type="button" onClick={reload} className="font-medium underline">Try again</button>
        </Alert>
      )}

      {!data && !error && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading resumes">
          {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-56 rounded-xl" />)}
        </div>
      )}

      {data?.length === 0 && (
        <Card>
          <EmptyState icon={FileText} title="No resumes yet" description="Upload your first PDF above. The first one becomes your default." />
        </Card>
      )}

      {data && data.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              onView={(r) => void view(r)}
              onShowText={setTextOf}
              onMakeDefault={(r) => void makeDefault(r)}
              onRename={setRenaming}
              onDelete={setToDelete}
            />
          ))}
        </ul>
      )}

      <Modal
        open={textOf !== null}
        onClose={() => setTextOf(null)}
        size="lg"
        title="Extracted text"
        description={textOf ? `${textOf.title} · ${countWords(textOf.extractedText).toLocaleString()} words` : undefined}
      >
        <div className="px-6 py-5">
          {textOf?.extractedText ? (
            <pre className="max-h-[60vh] overflow-auto rounded-lg bg-slate-50 p-4 font-sans text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
              {textOf.extractedText}
            </pre>
          ) : (
            <Alert tone="warning" title="No text could be extracted">
              This usually means the PDF is a scanned image. Export your resume from Word/Google Docs as a PDF to make it searchable.
            </Alert>
          )}
        </div>
      </Modal>

      <Modal open={renaming !== null} onClose={() => setRenaming(null)} title="Rename resume" size="sm">
        {renaming && (
          <RenameForm
            resume={renaming}
            onDone={(updated) => {
              setRenaming(null);
              if (updated) {
                showToast('Resume renamed');
                reload();
              }
            }}
          />
        )}
      </Modal>

      <ConfirmDialog
        open={toDelete !== null}
        title="Delete resume?"
        message={
          toDelete && (
            <>
              <strong className="text-slate-900">{toDelete.title}</strong> will be permanently deleted.
              {toDelete.applicationCount > 0 &&
                ` ${toDelete.applicationCount} application${toDelete.applicationCount === 1 ? '' : 's'} will keep their details but no longer link to it.`}
            </>
          )
        }
        loading={deleting}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setToDelete(null)}
      />
    </div>
  );
}
