"use client";

import { useState, useRef } from "react";
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { getCroppedImg, getMaskedImageBase64 } from "@/lib/image-processing";
import { parseLoanCard } from "@/lib/services/ocr-service";
import { createFullLoan } from "@/app/actions/loans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

interface ScanLoanFormProps {
  fundId: string; // <--- ADDED PROP
  onSuccess: () => void;
  onSwitchToManual: () => void;
}

export function ScanLoanForm({ fundId, onSuccess, onSwitchToManual }: ScanLoanFormProps) {
  const [step, setStep] = useState<'upload' | 'crop' | 'review'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);

  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [signatureBlob, setSignatureBlob] = useState<Blob | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    months: "",
    interest_rate: "7",
    start_date: new Date().toISOString().split('T')[0]
  });

  const [ocrCache, setOcrCache] = useState<any>(null);

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const result = reader.result?.toString() || '';
        setImgSrc(result);
        setOcrCache(null);
        setCrop(undefined);
        setSignatureBlob(null);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  async function onProcess() {
    if (!imgRef.current || !crop) return;

    if (ocrCache) {
      setFormData(ocrCache);
      setOcrCache(ocrCache);
      setStep('review');
      return;
    }

    setIsProcessing(true);

    try {
      const sigBlob = await getCroppedImg(imgRef.current, crop);
      setSignatureBlob(sigBlob);

      const maskedBase64 = getMaskedImageBase64(imgRef.current, crop);
      const parsedData = await parseLoanCard(maskedBase64);

      const newFormData = {
        name: parsedData.name || "",
        amount: parsedData.amount?.toString() || "",
        months: parsedData.months?.toString() || "",
        interest_rate: formData.interest_rate,
        start_date: parsedData.date ? new Date(parsedData.date).toISOString().split('T')[0] : formData.start_date
      };

      setOcrCache(newFormData);
      setFormData(newFormData);
      setStep('review');
    } catch (e) {
      console.error('OCR Processing Error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      toast.error(`Error processing image: ${errorMessage}\n\nPlease fill the form manually.`);
      setOcrCache(formData);
      setStep('review');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleSubmit() {
    setIsProcessing(true);

    const payload = new FormData();
    // 1. Append Fund ID
    payload.append("fund_id", fundId);

    payload.append("name", formData.name);
    payload.append("amount", formData.amount);
    payload.append("months", formData.months);
    payload.append("interest_rate", formData.interest_rate);
    payload.append("start_date", formData.start_date);

    if (signatureBlob) {
      payload.append("signature", signatureBlob, "signature.png");
    }

    try {
      await createFullLoan(payload);
      toast.success("Successfully processed loan scan.");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <>
      {/* STEP 1: UPLOAD */}
      {step === 'upload' && (
        <div className="space-y-3">
          {!imgSrc ? (
            <label
              className="flex flex-col items-center justify-center h-56 border-2 border-dashed rounded-lg bg-muted/50 cursor-pointer transition-all hover:bg-muted hover:border-primary hover:shadow-lg"
              onDragOver={(e) => {
                e.preventDefault();
                e.currentTarget.classList.add('border-primary', 'bg-primary/10');
              }}
              onDragLeave={(e) => {
                e.currentTarget.classList.remove('border-primary', 'bg-primary/10');
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.classList.remove('border-primary', 'bg-primary/10');
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  const file = e.dataTransfer.files[0];
                  const reader = new FileReader();
                  reader.addEventListener('load', () => {
                    const result = reader.result?.toString() || '';
                    setImgSrc(result);
                    setOcrCache(null);
                    setCrop(undefined);
                    setSignatureBlob(null);
                  });
                  reader.readAsDataURL(file);
                }
              }}
            >
              <Upload className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium mb-1">Click to upload or drag and drop</p>
              <p className="text-xs text-muted-foreground">Photo of the loan index card</p>
              <Input
                type="file"
                accept="image/*"
                onChange={onSelectFile}
                className="hidden"
              />
            </label>
          ) : (
            <div className="space-y-3">
              <div className="border rounded-lg overflow-hidden bg-black/5 p-3">
                <img
                  src={imgSrc}
                  alt="Uploaded card"
                  className="max-h-80 w-full object-contain mx-auto rounded"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setImgSrc('');
                    setOcrCache(null);
                    setCrop(undefined);
                    setSignatureBlob(null);
                  }}
                  className="flex-1 h-9"
                  size="sm"
                >
                  Choose Different Image
                </Button>
                <Button
                  type="button"
                  onClick={() => setStep('crop')}
                  className="flex-1 h-9"
                  size="sm"
                >
                  Continue to Crop
                </Button>
              </div>
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={onSwitchToManual}
            className="w-full h-9"
            size="sm"
          >
            ← Back to Manual Entry
          </Button>
        </div>
      )}

      {/* STEP 2: CROP */}
      {step === 'crop' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Highlight ONLY the signature.
          </p>
          <div className="border rounded overflow-hidden bg-black/5 flex items-center justify-center" style={{ maxHeight: 'calc(90vh - 280px)' }}>
            <ReactCrop crop={crop} onChange={c => setCrop(c)}>
              <img
                ref={imgRef}
                src={imgSrc || undefined}
                alt="Upload"
                className="object-contain"
                style={{ maxHeight: 'calc(90vh - 280px)', maxWidth: '100%' }}
              />
            </ReactCrop>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setStep('upload');
                setCrop(undefined);
              }}
              className="flex-1 h-9"
              size="sm"
            >
              ← Back
            </Button>
            <Button
              onClick={onProcess}
              disabled={!crop || isProcessing}
              className="flex-1 h-9"
              size="sm"
            >
              {isProcessing ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
              Extract Data
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: REVIEW */}
      {step === 'review' && (
        <div className="grid gap-3 p-1">
          <div className="grid gap-3" style={{ gridTemplateColumns: '2fr 1.5fr' }}>
            <div className="grid gap-1.5">
              <Label className="text-sm">Borrower Name</Label>
              <Input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="h-9"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm">Start Date</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                className="h-9 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-9 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: '0.5fr 0.5fr 0.5fr' }}>
            <div className="grid gap-1.5">
              <Label className="text-sm">Principal (₱)</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                step="0.01"
                className="h-9"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm">Terms (Months)</Label>
              <Input
                type="number"
                value={formData.months}
                onChange={e => setFormData({ ...formData, months: e.target.value })}
                className="h-9"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-sm">Interest (%)</Label>
              <Input
                type="number"
                value={formData.interest_rate}
                onChange={e => setFormData({ ...formData, interest_rate: e.target.value })}
                step="0.1"
                className="h-9"
              />
            </div>
          </div>

          {signatureBlob && (
            <div className="grid gap-1.5 p-3 border rounded bg-muted/20">
              <Label className="text-sm">Captured Signature</Label>
              <img
                src={URL.createObjectURL(signatureBlob)}
                alt="Signature"
                className="h-14 w-auto object-contain border bg-white rounded"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 mt-1">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOcrCache(formData);
                setStep('crop');
              }}
              size="sm"
              className="h-9"
            >
              ← Back to Crop
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isProcessing || !formData.name || !formData.amount || !formData.months}
              size="sm"
              className="h-9"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                  Saving...
                </>
              ) : (
                "Confirm Loan"
              )}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}