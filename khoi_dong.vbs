Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Lay duong dan thu muc
strPath = fso.GetParentFolderName(WScript.ScriptFullName)

' 0. Don dep sach se cac phien ban cu
WshShell.Run "taskkill /f /im ngrok.exe", 0, True
WshShell.Run "taskkill /f /im node.exe", 0, True

' 1. Chay Backend (An hoan toan)
WshShell.CurrentDirectory = strPath & "\backend"
WshShell.Run "cmd /c node server.js", 0, False

' 2. Chay Frontend (An hoan toan)
WshShell.CurrentDirectory = strPath & "\frontend"
WshShell.Run "cmd /c npm run dev", 0, False

' 3. Chay Ngrok (An hoan toan - Khong hien o Taskbar luon)
' Them tham so --log=stdout > nul de triet tieu cua so hien thi
WshShell.CurrentDirectory = strPath
WshShell.Run "cmd /c ngrok http --url=squshy-songfully-olen.ngrok-free.dev 5173 --host-header=localhost:5173 --log=stdout > nul", 0, False

' 4. Cho 10 giay cho he thong khoi dong xong
WScript.Sleep 10000

' 5. Mo trinh duyet kiem tra
WshShell.Run "http://localhost:5173"