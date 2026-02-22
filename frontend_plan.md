# Frontend Pages

## 1. Landing Page
[Navigate] to either student-sign-in or admin-sign-in page

## 2. Student or Admin Sign-in Page
[express] post /student-sign-in or post /admin-sign-in  inputs:(email,password)
[Navigate] to either student or admin side depending on which
-note that there is no sign up page as only "top privelege" or "super user" would be able to add students/gaurds, only "super user" would be able to add "top privelege" users

## 3. visitor entry page(landing page for student side)
[express] post /invite inputs:(host_email,guest_name,guest_contact_number)
-option to add field <key,value>(for example if someone wants to add their whatsapp contact number too, they can keep key as whatsapp contact number and value as its value)
[Navigate] to emergencies page

## 4. emergencies page
[express] get /emergencies <no inputs>

## 5. Admin landing page
[Navigate] live feed,past recordings and activities landing page
[Navigate] manage students/admin list page
[Navigate] notifications page
[Navigate] emergencies page

## 6. live feed,past recordings and activities landing page
[Navigate] live feed page
[Navigate] activities page
[Navigate] past recordings page

## 7. live feed page
- displays multiple videos at once, show toggle option to toggle between <different hostels,all view,other...> to show cameras of that particular area
- also display "view notifications" ,"view activities","view past recordings" buttons to navigate to those pages
- able to double click on a particular video to wach it on full screen mode(on double clicking again go back to previous screen)
- video display using:
WebRTC: handle WebRTC(connection with sfu media server)

## 8. activities landing page
- date filter to fetch activities in a particular time range, also shows recent top k activities(video thumbnails with title)(can click on video to play it)
[express] post /fetch-recent-activities  inputs:(date/time details)
[express] post /fetch-timerange-activities  inputs:(date/time details)
[Navigate] Activities video player (on clicking video)

## 9. activities video player page
[express] post /get-activity  inputs:(video input details)

## 10. past recordings landing page
- date filter to fetch past recording in particular time range, also an option to watch last 24hr recording

[Navigate] past recordings video player

## 11. past recordings video player page
-default mode:video with a timeline which we can scroll below
-full screen mode: on double clicking, full screen mode gets active(on double clicking again, it gets backto default mode)
[express] post /get-past-recording inputs:(recording input details)

## 12. manage students/admin list landing page 
- "hostels" and "admin" option
- on clicking "hostels", list of hostels appear: fetch using [express] /get-hostels-list  inputs:(hostel_name)
- on clicking "admin", list of admin priveleges appear: 3 priveleges:{super user,top previlege,gaurd}
[express] post /add-hostel inputs:(hostel_name)

previleges are as follow:

1. gaurd
-> cannot add any student/admin 
-> have access to all other features like notifications ,past recordings,live feed,activities for the <particular hostel / area> and not access to whole campus camperas

2. top privelege
-> can add students/gaurds
-> have access to all features for <particular hostel / area> as designated by the super user when added by it

3. super user
-> can add students/gaurds/top privelege/super user
-> have access to all features for whole campus

- on clicking particular hostel/admin privelege: list of users appear
[express] post /get-hostel-students-list inputs:(hostel_name,start,num_students)
[express] post /get-admin-users-list  inputs:(admin_previlege_name,start,num_users)
(dynamic retrieval of users- k users at a time)

- option to edit users for relevent user previlege
on clicking edit: 3 types of option : add/delete/edit user
[Navigate] to manage students/admin addition/deletion/editing page (on clicking edit button)

## 13. manage students/admin addition/deletion/editing page
[express] post /upload-manually
[express] post /upload-csv

## 14. notifications page
- shows the notifications of people entering(either on their own or a visitor on behalf of someone)
[websocket] get notifications via websockets(websockets server on port 5000)
[express] post /fetch-previous-notifications  inputs:(previous k notifications)

## Port informations:
web frontend: 5173
node backend:3000
websockets server:5000
<will update others when start making those, like media server,hardware simulator,fastapi server,mobile frontend>