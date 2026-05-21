import { useRef, useState } from "react";
import { Loader2, Upload, Youtube, Link as LinkIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPicked: (url: string) => void;
};

export function VideoPickerDialog({ open, onOpenChange, onPicked }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [ytUrl, setYtUrl] = useState("");
  const [driveUrl, setDriveUrl] = useState("");

  const handleFile = async (file: File) => {
    if (file.size > 100 * 1024 * 1024) {
      toast.error("Vídeo demasiado grande (máx 100MB)");
      return;
    }
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");
      const ext = file.name.split(".").pop() || "mp4";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("vsl-videos").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("vsl-videos").getPublicUrl(path);
      onPicked(data.publicUrl);
      onOpenChange(false);
      toast.success("Vídeo carregado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  const submitYoutube = () => {
    if (!ytUrl.trim()) return;
    onPicked(ytUrl.trim());
    setYtUrl("");
    onOpenChange(false);
  };

  const submitDrive = () => {
    const url = driveUrl.trim();
    if (!url) return;
    // Convert Google Drive share link to preview embed
    const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const embed = m ? `https://drive.google.com/file/d/${m[1]}/preview` : url;
    onPicked(embed);
    setDriveUrl("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Adicionar vídeo</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="upload">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload"><Upload className="mr-1 h-3.5 w-3.5" />Galeria</TabsTrigger>
            <TabsTrigger value="youtube"><Youtube className="mr-1 h-3.5 w-3.5" />YouTube</TabsTrigger>
            <TabsTrigger value="drive"><LinkIcon className="mr-1 h-3.5 w-3.5" />Drive</TabsTrigger>
          </TabsList>
          <TabsContent value="upload" className="space-y-3 pt-4">
            <input
              ref={fileRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full bg-gradient-primary text-primary-foreground"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Escolher do dispositivo"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">MP4, MOV, WebM até 100MB</p>
          </TabsContent>
          <TabsContent value="youtube" className="space-y-3 pt-4">
            <Input
              placeholder="https://youtube.com/watch?v=..."
              value={ytUrl}
              onChange={(e) => setYtUrl(e.target.value)}
            />
            <Button onClick={submitYoutube} className="w-full" disabled={!ytUrl.trim()}>Usar vídeo</Button>
          </TabsContent>
          <TabsContent value="drive" className="space-y-3 pt-4">
            <Input
              placeholder="https://drive.google.com/file/d/..."
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">O ficheiro tem de estar partilhado publicamente.</p>
            <Button onClick={submitDrive} className="w-full" disabled={!driveUrl.trim()}>Usar vídeo</Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

export function VideoPickerButton({ onPicked, label = "Carregar vídeo" }: { onPicked: (url: string) => void; label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="gap-1"
      >
        <Upload className="h-3.5 w-3.5" /> {label}
      </Button>
      <VideoPickerDialog open={open} onOpenChange={setOpen} onPicked={onPicked} />
    </>
  );
}

export { X as RemoveIcon };
