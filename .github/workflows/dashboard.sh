# Create index.html dynamically based on directories with HTML files
echo '<!DOCTYPE html><html><head><title>Reports</title></head><body>' > github-pages/index.html
echo '<h1>📊 Available HTML Reports</h1><ul>' >> github-pages/index.html

for dir in github-pages/*/; do
  if compgen -G "$dir*.html" > /dev/null; then
    name=$(basename "$dir")
    echo "<li><a href=\"$name/\">$name</a></li>" >> github-pages/index.html
  fi
done

echo '</ul></body></html>' >> github-pages/index.html
