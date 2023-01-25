# Webstorm Project

:smile:

### for a new project
- create directory

### to have dropbox and git ignore files
- do this BEFORE the directories and files get content
- copy files to project directory
  ```
  webstorm.md (this file)
  .gitignore
  db_xattr_get 
  db_xattr_set
  db_xattr_empty
  ```
- in terminal run
  ```
  chmod +x db_xattr_get
  chmod +x db_xattr_set
  chmod +x db_xattr_empty
  ls -al
  ```
- in terminal run (show missing files, create files, show files)
  ```
  ./db_xattr_get
  ./db_xattr_set
  ./db_xattr_get
  ```
- in terminal restart dropbox
  ```
  osascript -e 'tell application "Dropbox" to quit'
  open -a "Dropbox"
  ```
  
### git
fetch, merge
commit, push
