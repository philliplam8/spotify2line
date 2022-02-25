# CHANGELOG


## Unreleased
- 

## 2.0.2 (2022-02-20)
---
### Fixed :
- LINE's sender name does not allow the keyword "LINE" in it (see Documentation: https://developers.line.biz/en/reference/messaging-api/#icon-nickname-switch )
- Trimming the name of all users who have the word "LINE" in their name


## 2.0.1 (2022-02-20)
---
### Fixed :
- Added iOS support for 30 second song preview feature

## 2.0.0 (2022-02-19)
---
### New Features :
- Revamped broadcast message to use a single LINE Flex Message Type
- Added new Spotify 30 second song preview audio message

### Changes :
- Removed single Text Message and single Image Message
- Removed Quick Reply buttons

## 1.3.0  (2022-01-17)
---
### New Features :
- LINE broadcast message text will now display all artists instead of 1 (quick reply for multiple artists not supported yet though)

## 1.2.0  (2022-01-08)
---
### New Features :
- Added LINE Quick Reply Buttons to open song, artist's Spotify page, and open playlist
- Added sender name and icon that will appear in the chat and notification banner

## 1.1.0  (2022-01-06)
---
### New Features :
- Added album cover image to message during broadcast

## 1.0.0  (2022-01-03)
---
- Initial Implementation