"use client";

import { useState, useRef } from "react";
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { getCroppedImg, getMaskedImageBase64 } from "@/lib/image-processing";
import { parseLoanCard } from "@/lib/services/ocr-service";
import { createFullLoan } from "@/app/actions/loans";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ScanText, Upload } from "lucide-react";

export function CreateLoanModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'upload' | 'crop' | 'review'>('upload');
  const [isProcessing, setIsProcessing] = useState(false);

  // Image State
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [signatureBlob, setSignatureBlob] = useState<Blob | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    amount: "",
    months: "",
    interest_rate: "7", 
    start_date: new Date().toISOString().split('T')[0]
  });

  // 1. FIX: Only switch step AFTER image is loaded
  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const result = reader.result?.toString() || '';
        setImgSrc(result);
        // Only show crop screen if we actually have data
        if (result) {
          setStep('crop');
        }
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  // 2. Handle "Process"
  async function onProcess() {
    if (!imgRef.current || !crop) return;
    setIsProcessing(true);

    try {
      const sigBlob = await getCroppedImg(imgRef.current, crop);
      setSignatureBlob(sigBlob);

      const maskedBase64 = getMaskedImageBase64(imgRef.current, crop);
      const parsedData = await parseLoanCard(maskedBase64);

      setFormData(prev => ({
        ...prev,
        name: parsedData.name || "",
        amount: parsedData.amount?.toString() || "",
        months: parsedData.months?.toString() || "",
        start_date: parsedData.date ? new Date(parsedData.date).toISOString().split('T')[0] : prev.start_date
      }));

      setStep('review');
    } catch (e) {
      alert("Error processing image. Please fill manually.");
      setStep('review');
    } finally {
      setIsProcessing(false);
    }
  }

  // 3. Handle Final Submit
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsProcessing(true);

    const payload = new FormData();
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
      setOpen(false);
      setStep('upload');
      setImgSrc('');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
          <ScanText className="h-4 w-4" />
          New Loan
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'upload' && "Upload Loan Card"}
            {step === 'crop' && "Crop Signature Region"}
            {step === 'review' && "Review & Confirm"}
          </DialogTitle>
        </DialogHeader>

        {/* STEP 1: UPLOAD */}
        {step === 'upload' && (
          <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg bg-muted/50">
            <Upload className="h-10 w-10 text-muted-foreground mb-4" />
            <Input 
              type="file" 
              accept="image/*" 
              onChange={onSelectFile} 
              className="max-w-xs"
            />
            <p className="text-sm text-muted-foreground mt-2">Upload photo of the index card</p>
          </div>
        )}

        {/* STEP 2: CROP */}
        {step === 'crop' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Highlight ONLY the signature.
            </p>
            <div className="border rounded overflow-hidden bg-black/5">
              <ReactCrop crop={crop} onChange={c => setCrop(c)}>
                {/* Fix 2: Guard against empty src just in case */}
                <img 
                  ref={imgRef} 
                  src={imgSrc || undefined} 
                  alt="Upload" 
                  className="max-h-[50vh] object-contain mx-auto" 
                />
              </ReactCrop>
            </div>
            <Button 
              onClick={onProcess} 
              disabled={!crop || isProcessing} 
              className="w-full"
            >
              {isProcessing ? <Loader2 className="animate-spin mr-2" /> : null}
              Extract Data & Signature
            </Button>
          </div>
        )}

        {/* STEP 3: REVIEW */}
        {step === 'review' && (
          <form onSubmit={onSubmit} className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Borrower Name</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Input 
                  type="date"
                  value={formData.start_date} 
                  onChange={e => setFormData({...formData, start_date: e.target.value})}
                  required 
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2">
                <Label>Principal (₱)</Label>
                <Input 
                  type="number" 
                  value={formData.amount} 
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label>Terms (Months)</Label>
                <Input 
                  type="number" 
                  value={formData.months} 
                  onChange={e => setFormData({...formData, months: e.target.value})}
                  required 
                />
              </div>
              <div className="grid gap-2">
                <Label>Interest (%)</Label>
                <Input 
                  type="number" 
                  value={formData.interest_rate} 
                  onChange={e => setFormData({...formData, interest_rate: e.target.value})}
                  required 
                />
              </div>
            </div>

            <div className="grid gap-2 p-4 border rounded bg-muted/20">
              <Label>Captured Signature</Label>
              {signatureBlob && (
                <img 
                  src={URL.createObjectURL(signatureBlob)} 
                  alt="Sig" 
                  className="h-16 w-auto object-contain border bg-white rounded" 
                />
              )}
            </div>

            <div className="flex justify-end gap-2 mt-2">
              <Button variant="outline" onClick={() => { setStep('upload'); setImgSrc(''); }}>Cancel</Button>
              <Button type="submit" disabled={isProcessing}>
                {isProcessing ? "Saving..." : "Confirm Loan"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}