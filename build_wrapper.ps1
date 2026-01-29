npm run build > build_output.txt 2>&1
if ($LASTEXITCODE -ne 0) {
    echo "Build failed"
} else {
    echo "Build success"
}
