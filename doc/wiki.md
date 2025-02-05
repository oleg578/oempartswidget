# Wiki

## How to use page settings from customize theme panel?
The page settings are injected into page as javascript constant
pageSetting. The type of is json object

Example
```html
<script type="text/javascript">
  pageSettings = {{ section.settings | json }}
</script>
```
So,we can use it as 
```javascript
const imageLogo = pagesettings.image_logo
```
So, we use id from settings objects

## images requirements

### Foreground (logo) images
White on transparent background.
Canvas - 400x400

### Background images
Canvas - 400x400

Uploading images can be executed by dashboard Content->Files
