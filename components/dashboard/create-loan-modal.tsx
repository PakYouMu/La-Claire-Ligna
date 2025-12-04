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
import { Loader2, ScanText, Upload, Camera } from "lucide-react";

export function CreateLoanModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'manual' | 'scan'>('manual');
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

  // Cache for OCR results
  const [ocrCache, setOcrCache] = useState<any>(null);

  // Reset state when modal opens/closes
  function handleOpenChange(isOpen: boolean) {
    setOpen(isOpen);
    if (!isOpen) {
      // Reset everything when closing
      resetAllState();
    }
  }

  // Function to reset all state
  function resetAllState() {
    setMode('manual');
    setStep('upload');
    setImgSrc('');
    setCrop(undefined);
    setSignatureBlob(null);
    setOcrCache(null);
    setFormData({
      name: "",
      amount: "",
      months: "",
      interest_rate: "7",
      start_date: new Date().toISOString().split('T')[0]
    });
  }

  // Handle file selection
  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        const result = reader.result?.toString() || '';
        setImgSrc(result);
        // Clear cache when new image is selected
        setOcrCache(null);
        setCrop(undefined);
        setSignatureBlob(null);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  // Handle "Process" in scan mode
  async function onProcess() {
    if (!imgRef.current || !crop) return;
    
    // Check if we already have cached OCR results
    if (ocrCache) {
      console.log('Using cached OCR data (with user edits)');
      // Use the cached data which includes user edits
      setFormData(ocrCache);
      
      // Option C: Update cache when returning to review step
      // This ensures we capture the current state as a checkpoint
      setOcrCache(ocrCache);
      
      setStep('review');
      return;
    }

    setIsProcessing(true);

    try {
      // Extract the signature first
      const sigBlob = await getCroppedImg(imgRef.current, crop);
      setSignatureBlob(sigBlob);

      // Get the masked version (signature area blacked out) for OCR
      const maskedBase64 = getMaskedImageBase64(imgRef.current, crop);
      
      console.log('Sending masked image to OCR service...');
      const parsedData = await parseLoanCard(maskedBase64);
      console.log('OCR Response:', parsedData);

      const newFormData = {
        name: parsedData.name || "",
        amount: parsedData.amount?.toString() || "",
        months: parsedData.months?.toString() || "",
        interest_rate: formData.interest_rate, // Keep existing interest rate
        start_date: parsedData.date ? new Date(parsedData.date).toISOString().split('T')[0] : formData.start_date
      };

      // Cache the initial form data
      setOcrCache(newFormData);
      setFormData(newFormData);

      setStep('review');
    } catch (e) {
      console.error('OCR Processing Error:', e);
      const errorMessage = e instanceof Error ? e.message : 'Unknown error';
      alert(`Error processing image: ${errorMessage}\n\nPlease fill the form manually.`);
      
      // Option C: Even on error, cache current form state before going to review
      setOcrCache(formData);
      
      setStep('review');
    } finally {
      setIsProcessing(false);
    }
  }

  // Handle Final Submit
  async function handleSubmit() {
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
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsProcessing(false);
    }
  }

  // Switch to scan mode
  function switchToScanMode() {
    setMode('scan');
    setStep('upload');
    setImgSrc('');
    setCrop(undefined);
    setSignatureBlob(null);
  }

  // Switch back to manual mode
  function switchToManualMode() {
    setMode('manual');
    setStep('upload');
    setImgSrc('');
    setCrop(undefined);
    setSignatureBlob(null);
  }

  // Cancel and close modal
  function handleCancel() {
    resetAllState();
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-green-600 hover:bg-green-700 text-white">
          <ScanText className="h-4 w-4" />
          New Loan
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'manual' ? "Create New Loan" : 
             step === 'upload' ? "Upload Loan Card" :
             step === 'crop' ? "Crop Signature Region" :
             "Review & Confirm"}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>

        {/* MANUAL MODE - Default */}
        {mode === 'manual' && (
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Borrower Name</Label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter borrower name"
                />
              </div>
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Input 
                  type="date"
                  value={formData.start_date} 
                  onChange={e => setFormData({...formData, start_date: e.target.value})}
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
                  placeholder="0.00"
                  step="0.01"
                />
              </div>
              <div className="grid gap-2">
                <Label>Terms (Months)</Label>
                <Input 
                  type="number" 
                  value={formData.months} 
                  onChange={e => setFormData({...formData, months: e.target.value})}
                  placeholder="12"
                />
              </div>
              <div className="grid gap-2">
                <Label>Interest (%)</Label>
                <Input 
                  type="number" 
                  value={formData.interest_rate} 
                  onChange={e => setFormData({...formData, interest_rate: e.target.value})}
                  placeholder="7"
                  step="0.1"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Signature Image</Label>
              <Input 
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setSignatureBlob(e.target.files[0]);
                  }
                }}
              />
              {signatureBlob && (
                <div className="p-2 border rounded bg-muted/20">
                  <img 
                    src={URL.createObjectURL(signatureBlob)} 
                    alt="Signature Preview" 
                    className="h-16 w-auto object-contain border bg-white rounded" 
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-center py-4 border-t border-b">
              <Button 
                type="button"
                variant="outline" 
                onClick={switchToScanMode}
                className="gap-2"
              >
                <Camera className="h-4 w-4" />
                Or Scan Loan Card
              </Button>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isProcessing || !formData.name || !formData.amount || !formData.months}>
                {isProcessing ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  "Create Loan"
                )}
              </Button>
            </div>
          </div>
        )}

        {/* SCAN MODE */}
        {mode === 'scan' && (
          <>
            {/* STEP 1: UPLOAD */}
            {step === 'upload' && (
              <div className="space-y-4">
                {!imgSrc ? (
                  <label 
                    className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg bg-muted/50 cursor-pointer transition-all hover:bg-muted hover:border-primary hover:shadow-lg"
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
                          // Clear cache when new image is uploaded
                          setOcrCache(null);
                          setCrop(undefined);
                          setSignatureBlob(null);
                        });
                        reader.readAsDataURL(file);
                      }
                    }}
                  >
                    <Upload className="h-10 w-10 text-muted-foreground mb-4" />
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
                  <div className="space-y-4">
                    <div className="border rounded-lg overflow-hidden bg-black/5 p-4">
                      <img 
                        src={imgSrc} 
                        alt="Uploaded card" 
                        className="max-h-96 w-full object-contain mx-auto rounded" 
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setImgSrc('');
                          // Clear cache when choosing different image
                          setOcrCache(null);
                          setCrop(undefined);
                          setSignatureBlob(null);
                        }}
                        className="flex-1"
                      >
                        Choose Different Image
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setStep('crop')}
                        className="flex-1"
                      >
                        Continue to Crop
                      </Button>
                    </div>
                  </div>
                )}
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={switchToManualMode}
                  className="w-full"
                >
                  ← Back to Manual Entry
                </Button>
              </div>
            )}

            {/* STEP 2: CROP */}
            {step === 'crop' && (
              <div className="space-y-4">
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
                    className="flex-1"
                  >
                    ← Back
                  </Button>
                  <Button 
                    onClick={onProcess} 
                    disabled={!crop || isProcessing} 
                    className="flex-1"
                  >
                    {isProcessing ? <Loader2 className="animate-spin mr-2" /> : null}
                    Extract Data
                  </Button>
                </div>
              </div>
            )}

            {/* STEP 3: REVIEW */}
            {step === 'review' && (
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Borrower Name</Label>
                    <Input 
                      value={formData.name} 
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Start Date</Label>
                    <Input 
                      type="date"
                      value={formData.start_date} 
                      onChange={e => setFormData({...formData, start_date: e.target.value})}
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
                      step="0.01"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Terms (Months)</Label>
                    <Input 
                      type="number" 
                      value={formData.months} 
                      onChange={e => setFormData({...formData, months: e.target.value})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Interest (%)</Label>
                    <Input 
                      type="number" 
                      value={formData.interest_rate} 
                      onChange={e => setFormData({...formData, interest_rate: e.target.value})}
                      step="0.1"
                    />
                  </div>
                </div>

                {signatureBlob && (
                  <div className="grid gap-2 p-4 border rounded bg-muted/20">
                    <Label>Captured Signature</Label>
                    <img 
                      src={URL.createObjectURL(signatureBlob)} 
                      alt="Signature" 
                      className="h-16 w-auto object-contain border bg-white rounded" 
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 mt-2">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => {
                      // Save current form data to cache before going back
                      setOcrCache(formData);
                      setStep('crop');
                    }}
                  >
                    ← Back to Crop
                  </Button>
                  <Button onClick={handleSubmit} disabled={isProcessing || !formData.name || !formData.amount || !formData.months}>
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
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}